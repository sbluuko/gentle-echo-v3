// app/(app)/affirmations/review.tsx — FULL REPLACEMENT
// Step 4: Review + Create
// ✅ Title centered: "Review Your Affirmation"
// ✅ Buttons moved directly under review tile
// ✅ "Create this Affirmation" -> "Create Affirmation" (centered)
// ✅ Note text updated per request

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

const MAKE_CREATE_AFFIRMATION_URL = "https://hook.us2.make.com/eauqovdx69cae89r8lmmrndhv7rho64l";
const MAKE_DELETE_S3_URL = "https://hook.us2.make.com/j7o2lb216xmcfr3ex8gmnt014qaicnya";

const LIBRARY_META_PATH = (FileSystem as any).documentDirectory + "affirmations_library.json";
const AUDIO_DIR = (FileSystem as any).documentDirectory + "affirmations/";
const MAX_LIBRARY_ITEMS = 3;

type Affirmation = { id: string; title: string; text: string };
type Music = { id: string; title: string; url: string; previewUrl?: string; hz?: number; chakra?: string };
type Payload = { affirmation: Affirmation; music: Music };

type LibraryItem = {
  id: string;
  created_at: string;
  title: string;
  affirmation_text: string;
  music_id: string;
  music_title: string;
  final_url: string;
  s3_key?: string;
  local_path: string;
};

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

async function readLibrary(): Promise<LibraryItem[]> {
  try {
    const info = await FileSystem.getInfoAsync(LIBRARY_META_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(LIBRARY_META_PATH);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LibraryItem[]) : [];
  } catch {
    return [];
  }
}

async function writeLibrary(items: LibraryItem[]) {
  await FileSystem.writeAsStringAsync(LIBRARY_META_PATH, JSON.stringify(items, null, 2));
}

async function setIdleAudioMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });
}

function isProbablyUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim()
  );
}

function extractS3KeyFromUrl(url: string): string {
  try {
    const u = new URL(url);
    let p = u.pathname.replace(/^\/+/, "");
    if (p.startsWith("gentle-echo-audio/")) {
      p = p.slice("gentle-echo-audio/".length);
    }
    return p;
  } catch {
    return "";
  }
}

/**
 * Cleanly split the affirmation script into sentences/lines for Make iterator.
 * Works for your scripts that use "\n\n" between sentences.
 */
function splitAffirmationToSentences(raw: string): string[] {
  const text = (raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const parts = text
    .split(/\n\s*\n+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const fallback =
    parts.length <= 1
      ? text
          .split(/\n+/g)
          .map((s) => s.trim())
          .filter(Boolean)
      : parts;

  return fallback
    .map((s) => s.replace(/^\-+\s*/g, "").trim())
    .filter(Boolean);
}

export default function ReviewAffirmation() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const payload: Payload | null = useMemo(() => {
    const raw = typeof params.payload === "string" ? params.payload : "";
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }, [params.payload]);

  const affirmation = payload?.affirmation;
  const music = payload?.music;

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready.");

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();

    return () => {
      (async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.stopAsync().catch(() => {});
            await soundRef.current.unloadAsync().catch(() => {});
            soundRef.current = null;
          }
        } catch {}
      })();
    };
  }, [fade, lift]);

  const stopAndUnloadSound = async () => {
    try {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
        } catch {}
        try {
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }
    } catch {}
  };

  const playLocal = async (uri: string) => {
    await stopAndUnloadSound();
    await setIdleAudioMode();
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    soundRef.current = sound;

    sound.setOnPlaybackStatusUpdate(async (st: any) => {
      if (st?.isLoaded && st?.didJustFinish) {
        await stopAndUnloadSound();
      }
    });
  };

  const callDeleteS3Webhook = async (userId: string, s3Key: string) => {
    try {
      if (!s3Key) return;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);

      await fetch(MAKE_DELETE_S3_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3_key: s3Key, userId, user_id: userId }),
        signal: controller.signal,
      });

      clearTimeout(t);
    } catch {
      // silent by design
    }
  };

  const onBack = () => router.back();

  const onCreate = async () => {
    if (busy) return;

    if (!affirmation || !music) {
      Alert.alert("Missing data", "Affirmation or music selection is missing.");
      return;
    }

    if (!music.url || !music.url.trim()) {
      Alert.alert("Music missing", "Selected music is missing a full-track URL.");
      return;
    }

    try {
      setBusy(true);

      const affirmationText = (affirmation.text ?? "").trim();
      const affirmationSentences = splitAffirmationToSentences(affirmationText);

      console.log("SENDING sentences:", affirmationSentences.length, affirmationSentences[0]);

      setStatus("Checking login…");
      const { data: authRes, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw new Error(authErr.message);

      const userId = authRes?.user?.id;
      if (!userId) {
        Alert.alert("Not logged in", "Please log in again.");
        setStatus("Not logged in.");
        return;
      }

      if (!isProbablyUuid(userId)) {
        throw new Error(`Auth user id looks wrong (${userId}). This must be a Supabase UUID.`);
      }

      setStatus("Checking voice profile…");
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("voice_ready, voice_id")
        .eq("id", userId)
        .single();

      if (profErr) throw new Error(profErr.message);

      if (!profile?.voice_ready || !profile?.voice_id) {
        Alert.alert("Voice training needed", "Please complete voice training first.");
        router.replace("/(app)/train");
        return;
      }

      setStatus("Creating affirmation… This may take up to 5 Minutes. When completed you will automatically be taken to your Affirmation Library.");
      const makeBody = {
        user_id: userId,
        userId,
        voice_id: profile.voice_id,

        affirmation_id: affirmation.id,
        title: affirmation.title,

        affirmation_text: affirmationText,
        affirmation_sentences: affirmationSentences,

        music_id: music.id,
        music_title: music.title,
        music_url: music.url,

        hz: music.hz ?? null,
        chakra: music.chakra ?? null,
      };

      const res = await fetch(MAKE_CREATE_AFFIRMATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeBody),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Make returned ${res.status}: ${text}`);
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = {};
      }

      const finalUrl =
        (typeof parsed?.s3_url === "string" && parsed.s3_url.trim()) ||
        (typeof parsed?.finalUrl === "string" && parsed.finalUrl.trim()) ||
        (typeof parsed?.final_url === "string" && parsed.final_url.trim()) ||
        (typeof parsed?.processedAudioUrl === "string" && parsed.processedAudioUrl.trim()) ||
        (typeof parsed?.mixed_url === "string" && parsed.mixed_url.trim()) ||
        "";

      if (!finalUrl) {
        throw new Error(`Make success but no final URL returned. Response was: ${text || "(empty)"}`);
      }

      const s3Key =
        (typeof parsed?.s3_key === "string" && parsed.s3_key.trim()) ||
        (typeof parsed?.s3Key === "string" && parsed.s3Key.trim()) ||
        extractS3KeyFromUrl(finalUrl);

      setStatus("Saving to your library…");
      await ensureDir(AUDIO_DIR);

      const id = `${Date.now()}`;
      const localPath = `${AUDIO_DIR}${id}.mp3`;

      console.log("DOWNLOADING URL:", finalUrl);
      const dl = await FileSystem.downloadAsync(finalUrl, localPath);

      if (dl.status < 200 || dl.status >= 300) {
        try {
          await FileSystem.deleteAsync(localPath, { idempotent: true });
        } catch {}

        let host = "";
        try {
          host = new URL(finalUrl).host;
        } catch {}

        throw new Error(
          `Download failed: HTTP ${dl.status}\nHost: ${host || "unknown"}\nThis is usually an S3 permission/signature issue (403).`
        );
      }

      setStatus("Cleaning up…");
      await callDeleteS3Webhook(userId, s3Key);

      const current = await readLibrary();
      const item: LibraryItem = {
        id,
        created_at: new Date().toISOString(),
        title: affirmation.title,
        affirmation_text: affirmationText,
        music_id: music.id,
        music_title: music.title,
        final_url: finalUrl,
        s3_key: s3Key || undefined,
        local_path: localPath,
      };

      const next = [item, ...current];
      const keep = next.slice(0, MAX_LIBRARY_ITEMS);
      const remove = next.slice(MAX_LIBRARY_ITEMS);

      for (const r of remove) {
        try {
          await FileSystem.deleteAsync(r.local_path, { idempotent: true });
        } catch {}
      }

      await writeLibrary(keep);

      setStatus("Done. Playing…");
      await playLocal(localPath);

      router.replace("/(app)/affirmations/library");
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      Alert.alert("Error", msg);
      setStatus("Something went wrong. Try again.");
      console.log("REVIEW ERROR:", msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}>
          <Text style={styles.header}>Review Your Affirmation</Text>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Affirmation</Text>
            <Text style={styles.panelBody}>{affirmation?.title ?? "—"}</Text>

            <View style={{ height: 12 }} />

            <Text style={styles.panelTitle}>Music</Text>
            <Text style={styles.panelBody}>{music?.title ?? "—"}</Text>
          </View>

          {/* ✅ Buttons moved directly under Review tile */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={busy}
              onPress={onBack}
              style={[styles.btn, styles.btnGhost, busy && styles.disabled]}
            >
              <Text style={styles.btnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              disabled={busy}
              onPress={onCreate}
              style={[styles.btn, styles.btnPrimary, busy && styles.disabled]}
            >
              <Text style={styles.btnText}>{busy ? "Creating…" : "Create Affirmation"}</Text>
            </TouchableOpacity>
          </View>

          {/* Status card stays below buttons */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status</Text>
            <Text style={styles.cardBody}>{status}</Text>

            {busy ? (
              <View style={styles.row}>
                <ActivityIndicator color="rgba(242,240,234,0.82)" />
                <Text style={styles.rowText}>Working…</Text>
              </View>
            ) : null}
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  dusk: "#26384C",
  text: "#F2F0EA",
  textDim: "rgba(242,240,234,0.70)",
  panel: "rgba(255,255,255,0.12)",
  panelBorder: "rgba(255,255,255,0.14)",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dusk },
  scroll: { padding: 16, paddingBottom: 40 },
  inner: { paddingTop: 70 },

  header: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },

  panel: {
    borderRadius: 16,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    padding: 14,
    marginBottom: 12,
  },
  panelTitle: {
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: 6,
  },
  panelBody: {
    color: "rgba(242,240,234,0.82)",
    fontSize: 13.5,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 19,
  },

  card: {
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 14,
    marginTop: 12,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  cardBody: {
    color: "rgba(242,240,234,0.82)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 19,
  },

  row: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  rowText: { color: COLORS.textDim, fontSize: 13, fontWeight: "700" },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  btn: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: "rgba(59,130,246,0.78)",
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
  },
  btnGhost: { backgroundColor: "rgba(0,0,0,0.20)", borderColor: "rgba(255,255,255,0.12)" },
  btnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  note: {
    marginTop: 12,
    color: "rgba(242,240,234,0.70)",
    fontSize: 12.5,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 18,
  },

  disabled: { opacity: 0.65 },
});
