// app/(app)/main.tsx — FULL REPLACEMENT
// ✅ Uses global AppScreen background
// ✅ Keeps Voice Echo logic + UI
// ✅ Removes bottom debug writing
// ✅ Echo Library navigation uses router.push() so Back works
// ✅ Still gates to Train if voice not ready
// ✅ Uses shared audio helper for consistent playback / recording mode

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppScreen from "../../components/AppScreen";
import { setAppPlaybackAudioMode, setAppRecordingAudioMode } from "../../lib/audio";
import { supabase } from "../../lib/supabase";

const MAKE_PROCESSMESSAGE_URL =
  "https://hook.us2.make.com/3warr9f3b4llyy8lfzod7tksl3n82vfw";

const MAKE_DELETE_S3_URL =
  "https://hook.us2.make.com/j7o2lb216xmcfr3ex8gmnt014qaicnya";

const ECHO_LIBRARY_JSON = "gentleecho_echo_library.json";
const ECHO_LIBRARY_DIR = "gentleecho_echos";

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: undefined as any,
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const meteringToLevel = (db: number | undefined) => {
  if (db === undefined || db === null) return 0;
  const normalized = (db + 60) / 60;
  return clamp(normalized, 0, 1);
};

function WaveformBars({ active, level }: { active: boolean; level: number }) {
  const weights = useMemo(
    () => [
      0.16, 0.18, 0.22, 0.26, 0.32, 0.4, 0.5, 0.62, 0.76, 0.9, 1.0, 0.96,
      0.9, 0.84, 0.78, 0.74, 0.74, 0.78, 0.84, 0.9, 0.96, 1.0, 0.9, 0.76,
      0.62, 0.5, 0.4, 0.32, 0.26, 0.22, 0.18, 0.16,
    ],
    []
  );

  const effective = active ? level : 0.08;

  return (
    <View style={styles.waveWrapInner}>
      <View style={styles.waveInner}>
        {weights.map((w, i) => {
          const amp = clamp(effective * (0.35 + w * 0.9), 0, 1);
          const minH = 6;
          const maxH = 54;
          const h = minH + amp * (maxH - minH);

          return (
            <View
              key={i}
              style={[
                styles.waveBar,
                { height: h, opacity: active ? 0.95 : 0.35 },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

type EchoItem = {
  id: string;
  title: string;
  createdAt: string;
  localUri: string;
};

export default function Main() {
  const router = useRouter();

  const recordingRef = useRef<Audio.Recording | null>(null);

  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusLine, setStatusLine] = useState<string>("Ready to record");
  const [waveLevel, setWaveLevel] = useState(0);

  const jobInFlightRef = useRef(false);
  const mountedRef = useRef(true);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  const getDocBase = () => {
    const fs: any = FileSystem as any;
    return fs?.documentDirectory ?? null;
  };

  const getLibraryJsonPath = () => {
    const base = getDocBase();
    if (!base) return null;
    return `${base}${ECHO_LIBRARY_JSON}`;
  };

  const getLibraryDirPath = () => {
    const base = getDocBase();
    if (!base) return null;
    return `${base}${ECHO_LIBRARY_DIR}`;
  };

  const ensureLibraryDir = async () => {
    const dir = getLibraryDirPath();
    if (!dir) throw new Error("Device storage unavailable.");
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  };

  const readLibrary = async (): Promise<EchoItem[]> => {
    const path = getLibraryJsonPath();
    if (!path) return [];
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return [];
      const raw = await FileSystem.readAsStringAsync(path);
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as EchoItem[]) : [];
    } catch {
      return [];
    }
  };

  const writeLibrary = async (items: EchoItem[]) => {
    const path = getLibraryJsonPath();
    if (!path) return;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(items, null, 2));
  };

  const deleteLocalIfExists = async (uri: string) => {
    try {
      if (!uri) return;
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch {
      // silent
    }
  };

  const addEchoToLibrary = async (localUri: string): Promise<string> => {
    const id = `${Date.now()}`;
    const createdAt = new Date().toISOString();
    const title = `Inner Wisdom ${new Date().toLocaleString()}`;

    const items = await readLibrary();
    const next: EchoItem[] = [{ id, title, createdAt, localUri }, ...items];

    const keep = next.slice(0, 5);
    const removed = next.slice(5);

    for (const r of removed) {
      await deleteLocalIfExists(r.localUri);
    }

    await writeLibrary(keep);
    return id;
  };

  const ensureVoiceReadyOrRedirect = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        Alert.alert("Not logged in", "Please log in again");
        setStatusLine("Not logged in");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("voice_ready, voice_id")
        .eq("id", userId)
        .single();

      if (error) return;

      if (!profile?.voice_ready || !profile?.voice_id) {
        router.replace("/(app)/train");
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      await setAppPlaybackAudioMode();
      await ensureVoiceReadyOrRedirect();
      await ensureLibraryDir();
    })();

    return () => {
      mountedRef.current = false;
      const rec = recordingRef.current;
      recordingRef.current = null;

      void (async () => {
        try {
          if (rec) {
            try {
              await rec.stopAndUnloadAsync();
            } catch {}
          }
        } finally {
          try {
            await setAppPlaybackAudioMode();
          } catch {}
        }
      })();
    };
  }, [router]);

  const startRecording = async () => {
    try {
      if (busy || isRecording || jobInFlightRef.current) return;

      setBusy(true);
      setStatusLine("Requesting microphone permission…");

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Microphone permission is required.");
        setStatusLine("Microphone permission not granted.");
        return;
      }

      await setAppRecordingAudioMode();

      const rec = new Audio.Recording();
      rec.setOnRecordingStatusUpdate((st: any) => {
        if (st?.isRecording) setWaveLevel(meteringToLevel(st?.metering));
      });

      await rec.prepareToRecordAsync(RECORDING_OPTIONS);
      await rec.startAsync();

      recordingRef.current = rec;

      setRecordedUri(null);
      setIsRecording(true);
      setStatusLine("Recording in progress…");
    } catch (e: any) {
      Alert.alert("Record error", String(e?.message ?? e));
      setStatusLine("Error starting recording.");
      setIsRecording(false);
      setWaveLevel(0);

      try {
        await setAppPlaybackAudioMode();
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  const stopRecordingOnly = async () => {
    const rec = recordingRef.current;
    if (!rec) return null;

    await rec.stopAndUnloadAsync();
    const uri = rec.getURI();
    recordingRef.current = null;

    await setAppPlaybackAudioMode();

    setIsRecording(false);
    setWaveLevel(0);

    return uri ?? null;
  };

  const stopRecording = async () => {
    try {
      if (busy || !isRecording) return;
      setBusy(true);
      setStatusLine("Stopping…");

      const uri = await stopRecordingOnly();
      if (uri) {
        setRecordedUri(uri);
        setStatusLine("Recording complete. Ready to create your echo.");
      } else {
        setStatusLine("Ready to record");
      }
    } catch (e: any) {
      Alert.alert("Stop error", String(e?.message ?? e));
      setStatusLine("Error stopping recording.");
      setIsRecording(false);
      setWaveLevel(0);

      try {
        await setAppPlaybackAudioMode();
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  const callDeleteS3Webhook = async (userId: string, s3Key: string) => {
    try {
      if (!s3Key) return;

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);

      await fetch(MAKE_DELETE_S3_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3_key: s3Key ?? "", userId, user_id: userId }),
        signal: controller.signal,
      });

      clearTimeout(t);
    } catch {
      // silent by design
    }
  };

  const processMessageDownloadSaveAndGoToLibrary = async (uriToSend: string) => {
    if (jobInFlightRef.current) return;
    jobInFlightRef.current = true;

    try {
      setStatusLine("Checking login…");

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        Alert.alert("Not logged in", "Please log in again.");
        setStatusLine("Not logged in.");
        return;
      }

      setStatusLine("Processing your echo. This may take a couple of minutes. When complete you will automatically be taken to your Inner Wisdom library");

      const fs: any = FileSystem as any;
      const uploadType =
        fs?.FileSystemUploadType?.MULTIPART ?? ("multipart" as any);

      const res = await FileSystem.uploadAsync(MAKE_PROCESSMESSAGE_URL, uriToSend, {
        httpMethod: "POST",
        uploadType,
        fieldName: "file",
        mimeType: "audio/m4a",
        parameters: { mode: "message", userId, user_id: userId },
      });

      if (res.status < 200 || res.status >= 300) {
        const snippet = (res as any)?.body
          ? `\n\n${String((res as any).body).slice(0, 350)}`
          : "";
        throw new Error(`Make failed (${res.status})${snippet}`);
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse((res as any)?.body || "{}");
      } catch {
        parsed = {};
      }

      const finalUrl =
        (typeof parsed?.processedAudioUrl === "string" &&
          parsed.processedAudioUrl.trim()) ||
        (typeof parsed?.s3_url === "string" && parsed.s3_url.trim()) ||
        "";

      if (!finalUrl) throw new Error("Make returned success but no processedAudioUrl.");

      const s3Key =
        (typeof parsed?.s3_key === "string" && parsed.s3_key.trim()) ||
        (typeof parsed?.s3Key === "string" && parsed.s3Key.trim()) ||
        (() => {
          try {
            const u = new URL(finalUrl);
            const p = u.pathname.replace(/^\/+/, "");
            return p.startsWith("gentle-echo-audio/")
              ? p.slice("gentle-echo-audio/".length)
              : p;
          } catch {
            return "";
          }
        })();

      setStatusLine("Downloading your echo…");

      const dir = await ensureLibraryDir();
      const filename = `echo_${Date.now()}.mp3`;
      const target = `${dir}/${filename}`;

      const dl = await FileSystem.downloadAsync(finalUrl, target);
      if (dl.status < 200 || dl.status >= 300) {
        throw new Error(`Download failed: HTTP ${dl.status}`);
      }

      await callDeleteS3Webhook(userId, s3Key);

      setStatusLine("Saving to your Echo Library…");
      const echoId = await addEchoToLibrary(target);

      setStatusLine("Opening Echo Library…");
      await setAppPlaybackAudioMode();

      router.push({
        pathname: "/(app)/echo-library",
        params: { autoplay: "1", id: echoId },
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      Alert.alert("Error", msg);
      setStatusLine("Something went wrong. Try again.");

      try {
        await setAppPlaybackAudioMode();
      } catch {}
    } finally {
      jobInFlightRef.current = false;
    }
  };

  const createEcho = async () => {
    try {
      if (busy || isRecording || jobInFlightRef.current) return;

      setBusy(true);

      const uriToSend = recordedUri;

      if (!uriToSend) {
        Alert.alert("Nothing to send", "Record your message first.");
        setStatusLine("Ready to record");
        return;
      }

      setStatusLine("Creating your echo…");
      await processMessageDownloadSaveAndGoToLibrary(uriToSend);
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
      setStatusLine("Error creating echo.");

      try {
        await setAppPlaybackAudioMode();
      } catch {}
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const canRecord = !busy && !isRecording && !jobInFlightRef.current;
  const canStop = !busy && isRecording && !jobInFlightRef.current;
  const canCreate =
    !!recordedUri && !busy && !isRecording && !jobInFlightRef.current;

  const StepLine = ({ label, text }: { label: string; text: string }) => (
    <View style={styles.stepRow}>
      <Text style={styles.stepLabel}>{label}</Text>
      <Text style={styles.stepBody}>{text}</Text>
    </View>
  );

  return (
    <AppScreen scroll>
      <Stack.Screen options={{ title: "VOICE ECHO" }} />

      <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}>
        <View style={styles.stepCard}>
          <StepLine label="STEP 1:" text="Press the RECORD button and record your thoughts" />
          <StepLine label="STEP 2:" text="When finished recording press the STOP button" />
          <StepLine label="STEP 3:" text="Select CREATE MY INNER WISDOM button to create your playback message" />
          <StepLine label="STEP 4:" text="When the message is ready you will automatically be taken to your Inner Wisdom Library" />
        </View>

        <View style={styles.spaceHeaderToRecord} />

        <View style={styles.recordPanel}>
          <Text style={styles.recordTitle}>Record Your Message</Text>

          <WaveformBars active={isRecording} level={waveLevel} />

          <View style={styles.spaceWaveToButtons} />

          <View style={styles.recordStopRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={startRecording}
              disabled={!canRecord}
              style={[
                styles.squareAction,
                styles.squareGreen,
                styles.recordWide,
                !canRecord && styles.disabled,
              ]}
            >
              <Text style={styles.squareActionText}>RECORD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={stopRecording}
              disabled={!canStop}
              style={[
                styles.squareAction,
                styles.squareRed,
                styles.stopNarrow,
                !canStop && styles.disabled,
              ]}
            >
              <Text style={styles.squareActionText}>STOP</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spaceRowToCreate} />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={createEcho}
            disabled={!canCreate}
            style={[
              styles.squareAction,
              styles.squareBlue,
              !canCreate && styles.disabled,
            ]}
          >
            <Text style={styles.squareActionText}>CREATE MY INNER WISDOM</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gapRecordToStatus} />

        <View style={styles.statusCardSmall}>
          <Text style={styles.statusTitleSmall}>What's Happening Now</Text>
          <Text style={styles.statusLineSmall}>{statusLine}</Text>

          {busy ? (
            <View style={styles.workingRow}>
              <ActivityIndicator color={COLORS.textSoft} />
              <Text style={styles.workingText}>Working…</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.gapStatusToLibraryBtn} />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/(app)/echo-library")}
          style={styles.libraryButtonGreen}
        >
          <Text style={styles.libraryButtonText}>GO TO MY INNER WISDOM LIBRARY</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />
      </Animated.View>
    </AppScreen>
  );
}

const COLORS = {
  text: "#F2F0EA",
  textSoft: "rgba(242,240,234,0.82)",
  textDim: "rgba(242,240,234,0.70)",

  panel: "rgba(19, 31, 167, 0.7)",
  panelBorder: "rgba(255,255,255,0.14)",

  actionGreen: "rgba(34,197,94,0.78)",
  actionRed: "rgba(239,68,68,0.78)",
  actionBlue: "rgba(59,130,246,0.78)",

  waveBg: "rgba(255,255,255,0.15)",
  waveBorder: "rgba(238, 230, 230, 0.35)",

  libraryGreen: "rgba(34,197,94,0.80)",
};

const styles = StyleSheet.create({
  inner: {
    paddingTop: 6,
  },

  stepCard: {
    borderRadius: 18,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 7,
  },
  stepLabel: {
    width: 70,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: "900",
    letterSpacing: 0.1,
    lineHeight: 19,
  },
  stepBody: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: "700",
    letterSpacing: 0.1,
    lineHeight: 19,
  },

  spaceHeaderToRecord: { height: 18 },

  recordPanel: {
    borderRadius: 18,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 0.25,
    marginBottom: 10,
    textAlign: "center",
  },

  waveWrapInner: {
    borderRadius: 16,
    backgroundColor: COLORS.waveBg,
    borderWidth: 1,
    borderColor: COLORS.waveBorder,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  waveInner: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: "rgba(241, 242, 234, 0.95)",
  },

  spaceWaveToButtons: { height: 14 },

  recordStopRow: {
    flexDirection: "row",
    gap: 10,
  },

  squareAction: {
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  recordWide: { flex: 2 },
  stopNarrow: { flex: 1 },

  squareGreen: {
    backgroundColor: COLORS.actionGreen,
    borderColor: "rgba(255,255,255,0.12)",
  },
  squareRed: {
    backgroundColor: COLORS.actionRed,
    borderColor: "rgba(0,0,0,0.12)",
  },
  squareBlue: {
    backgroundColor: COLORS.actionBlue,
    borderColor: "rgba(255,255,255,0.12)",
  },

  squareActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.25,
    textAlign: "center",
  },

  spaceRowToCreate: { height: 12 },

  gapRecordToStatus: { height: 12 },

  statusCardSmall: {
    alignSelf: "center",
    width: "75%",
    borderRadius: 14,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  statusTitleSmall: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.25,
    marginBottom: 6,
    textAlign: "center",
  },

  statusLineSmall: {
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: "center",
    lineHeight: 19,
    letterSpacing: 0.1,
  },

  workingRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  workingText: {
    marginLeft: 10,
    fontSize: 12,
    color: COLORS.textDim,
    fontWeight: "800",
  },

  gapStatusToLibraryBtn: { height: 18 },

  libraryButtonGreen: {
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: COLORS.libraryGreen,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  libraryButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: 0.3,
    fontSize: 13,
    textAlign: "center",
  },

  disabled: { opacity: 0.6 },
});