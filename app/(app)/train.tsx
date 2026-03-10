// app/(app)/train.tsx — FULL REPLACEMENT
// ✅ Removes "Listen to Your Recording" button
// ✅ Fixes iPhone false "must be at least 30 seconds" issue
// ✅ Uses real elapsed time instead of trusting final iPhone recording metadata
// ✅ Keeps your scroll + fixed footer layout
// ✅ Keeps boot guard + success modal
// ✅ Safely switches audio mode between record and playback
// ✅ FIX: training only completes when a real voice_id is returned
// ✅ FIX: no more half-finished state with voice_ready=true and voice_id=null

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

const MAKE_CREATEVOICE_URL =
  "https://hook.us2.make.com/j1ctu3nosul9ddy3lf2jsgmv8snq8p1j";

const MIN_SECONDS = 30;
const MAX_SECONDS = 90;

// Footer sizing (used to pad ScrollView content so it won't hide behind footer)
const FOOTER_BASE_HEIGHT = 112;

export default function Train() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✅ Real elapsed-time tracking for iPhone reliability
  const recordingStartedAtRef = useRef<number | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  const [busy, setBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number>(0);

  const [userId, setUserId] = useState<string | null>(null);
  const [bootChecking, setBootChecking] = useState(true);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      void safeUnloadSound();

      try {
        recordingRef.current?.stopAndUnloadAsync?.().catch(() => {});
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPlaybackMode = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
  };

  const setRecordingMode = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
  };

  const safeUnloadSound = async () => {
    try {
      const s = soundRef.current;
      if (s) {
        soundRef.current = null;
        await s.stopAsync().catch(() => {});
        await s.unloadAsync().catch(() => {});
      }
    } catch {}
  };

  // ✅ Boot guard: if already trained, do NOT allow Train screen
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        setBootChecking(true);

        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authData?.user?.id) {
          if (!cancelled) {
            Alert.alert("Not logged in", "Please sign in again.");
          }
          return;
        }

        const uid = authData.user.id;
        if (cancelled) return;
        setUserId(uid);

        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("voice_ready, voice_id")
          .eq("id", uid)
          .single();

        if (cancelled) return;

        if (!profErr && !!profile?.voice_ready && !!profile?.voice_id) {
          router.replace("/(app)/home");
          return;
        }
      } finally {
        if (!cancelled) setBootChecking(false);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const scriptText = useMemo(
    () =>
      [
        "I’m recording this script one time only to let Inner Wisdom learn the natural sound of my voice so my recordings play back in a fully personalized message.",
        "",
        "There’s no need to speak perfectly. If I pause, repeat myself, or stumble over a word or two, that’s completely fine. Just keep on reading as natural speech actually helps create a better voice match.",
        "",
        "My voice clone will be kept private and used only for my own recordings and I can delete my voice clone at any time.",
        "",
        "Inner Wisdom is where I can freely express my thoughts and receive a message of clarity in return. When stress hijacks my thinking, I can talk it out, clear my head and ground myself.",
        "",
        "I give my consent for Inner Wisdom to create and securely store a private voice clone for generating audio in my voice.",
      ].join("\n"),
    []
  );

  const clearRecordingState = async () => {
    await safeUnloadSound();
    setRecordingUri(null);
    setDurationSec(0);
    recordingStartedAtRef.current = null;
  };

  const getElapsedRecordingSeconds = () => {
    const startedAt = recordingStartedAtRef.current;
    if (!startedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  };

  const updateDurationTimer = async () => {
    const elapsedSec = getElapsedRecordingSeconds();
    setDurationSec(elapsedSec);

    try {
      const rec = recordingRef.current;
      if (!rec) return;
      await rec.getStatusAsync();
    } catch {}
  };

  const startRecording = async () => {
    if (busy || isRecording || isCreating || bootChecking) return;

    try {
      setBusy(true);
      await clearRecordingState();

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Microphone access needed", "Please allow microphone access.");
        return;
      }

      await safeUnloadSound();
      await setRecordingMode();

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      recordingRef.current = rec;
      recordingStartedAtRef.current = Date.now();
      setDurationSec(0);
      setIsRecording(true);

      durationIntervalRef.current = setInterval(() => {
        void updateDurationTimer();
      }, 250);
    } catch (e: any) {
      Alert.alert("Recording error", String(e?.message ?? e));
      setIsRecording(false);
      recordingRef.current = null;
      recordingStartedAtRef.current = null;
      setDurationSec(0);

      try {
        await setPlaybackMode();
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  const stopRecording = async () => {
    if (busy || !isRecording || isCreating || bootChecking) return;

    try {
      setBusy(true);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      const rec = recordingRef.current;
      if (!rec) return;

      const elapsedSec = getElapsedRecordingSeconds();

      await rec.stopAndUnloadAsync();
      await new Promise((resolve) => setTimeout(resolve, 350));

      const uri = rec.getURI();

      let statusDurationSec = 0;
      try {
        const status: any = await rec.getStatusAsync();
        statusDurationSec = Math.floor((status?.durationMillis ?? 0) / 1000);
      } catch {}

      recordingRef.current = null;
      setIsRecording(false);

      const finalSec = Math.max(elapsedSec, statusDurationSec);
      setDurationSec(finalSec);

      await setPlaybackMode();

      if (finalSec < MIN_SECONDS) {
        await clearRecordingState();
        Alert.alert("Recording too short", `Please record at least ${MIN_SECONDS} seconds.`);
        return;
      }

      if (finalSec > MAX_SECONDS) {
        await clearRecordingState();
        Alert.alert(
          "Recording too long",
          `Please keep the recording to ${MAX_SECONDS} seconds or less.`
        );
        return;
      }

      setRecordingUri(uri ?? null);
    } catch (e: any) {
      Alert.alert("Stop error", String(e?.message ?? e));
      try {
        await setPlaybackMode();
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  const uploadTraining = async () => {
    if (!recordingUri || isCreating || busy || bootChecking) return;

    if (!userId) {
      Alert.alert("Not signed in", "Please sign in again.");
      return;
    }

    try {
      setIsCreating(true);

      const fs: any = FileSystem as any;
      const uploadType = fs?.FileSystemUploadType?.MULTIPART ?? ("multipart" as any);

      const res = await FileSystem.uploadAsync(MAKE_CREATEVOICE_URL, recordingUri, {
        httpMethod: "POST",
        uploadType,
        fieldName: "file",
        mimeType: "audio/m4a",
        parameters: { mode: "train", userId },
      });

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Training failed (${res.status})`);
      }

      let returnedVoiceId: string | null = null;
      const rawBody = (res as any)?.body;
      if (rawBody && typeof rawBody === "string") {
        try {
          const parsed = JSON.parse(rawBody);
          if (typeof parsed?.voice_id === "string" && parsed.voice_id.trim()) {
            returnedVoiceId = parsed.voice_id.trim();
          }
          if (!returnedVoiceId && typeof parsed?.voiceId === "string" && parsed.voiceId.trim()) {
            returnedVoiceId = parsed.voiceId.trim();
          }
        } catch {}
      }

      if (!returnedVoiceId) {
        throw new Error(
          "Voice creation did not return a voice ID. Your training was not completed. Please try again."
        );
      }

      const updatePayload = {
        voice_ready: true,
        voice_id: returnedVoiceId,
      };

      const { error: updErr } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId);

      if (updErr) {
        throw new Error(`Profile update failed: ${updErr.message}`);
      }

      setShowSuccessModal(true);
    } catch (e: any) {
      Alert.alert("Training error", String(e?.message ?? e));
    } finally {
      setIsCreating(false);
    }
  };

  const readyToCreate =
    !!recordingUri && durationSec >= MIN_SECONDS && durationSec <= MAX_SECONDS;

  const disableAll = busy || isCreating || bootChecking;

  const recordDisabled = disableAll || isRecording;
  const stopDisabled = disableAll || !isRecording;
  const createDisabled = disableAll || isRecording || !readyToCreate;

  const footerHeight = FOOTER_BASE_HEIGHT + insets.bottom;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
      >
        <Animated.View
          style={[styles.screen, { opacity: fade, transform: [{ translateY: lift }] }]}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: 24,
                paddingBottom: footerHeight + 12,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.cardBody}>{scriptText}</Text>
            </View>

            <Text style={styles.progressText}>
              {bootChecking
                ? "Checking profile…"
                : isRecording
                ? `Recording… ${durationSec}s`
                : `Duration: ${durationSec}s`}
            </Text>

            <Text style={styles.hintText}>
              Record between {MIN_SECONDS}-{MAX_SECONDS} seconds, then create your voice.
            </Text>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.footerRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={recordDisabled}
                onPress={startRecording}
                style={[styles.squareBtn, styles.greenBtn, recordDisabled && styles.btnDisabled]}
              >
                <Text style={styles.btnText}>{isRecording ? "Recording…" : "Record"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                disabled={stopDisabled}
                onPress={stopRecording}
                style={[styles.squareBtn, styles.redBtn, stopDisabled && styles.btnDisabled]}
              >
                <Text style={styles.btnText}>Stop</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRowSingle}>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={createDisabled}
                onPress={uploadTraining}
                style={[styles.fullWidthBtn, styles.greenBtn, createDisabled && styles.btnDisabled]}
              >
                <Text style={styles.btnTextSmall}>
                  {isCreating ? "Creating…" : "Create Voice"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => {}}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Your voice clone is ready</Text>

                <Text style={styles.modalBody}>
                  Your voice clone has been successfully recorded.
                  {"\n\n"}
                  You can now proceed to the home screen.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.modalButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.replace("/(app)/home");
                  }}
                >
                  <Text style={styles.modalButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#26384C" },
  container: { flex: 1, backgroundColor: "#26384C" },
  screen: { flex: 1 },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    justifyContent: "flex-start",
  },

  card: {
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },

  cardBody: {
    color: "#ffffff",
    fontSize: 13.4,
    lineHeight: 19.5,
    fontWeight: "400",
    textAlign: "center",
  },

  progressText: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 6,
    opacity: 0.92,
  },

  hintText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "#26384C",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },

  footerRowSingle: {
    marginBottom: 10,
  },

  squareBtn: {
    flex: 1,
    height: 64,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  fullWidthBtn: {
    width: "100%",
    height: 64,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  greenBtn: { backgroundColor: "#16a34a" },
  redBtn: { backgroundColor: "#dc2626" },

  btnDisabled: { opacity: 0.45 },

  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  btnTextSmall: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.15,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#26384C",
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  modalBody: {
    color: "#D6DEE8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 18,
  },
  modalButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#26384C",
    fontSize: 16,
    fontWeight: "900",
  },
});