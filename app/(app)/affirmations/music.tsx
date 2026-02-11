// app/(app)/affirmations/music.tsx — FULL REPLACEMENT
// Step 3: Music picker with preview + choose
// ✅ Center title + subtitle
// ✅ Title: "Choose Your Background Music" (one line)
// ✅ Subtitle text updated
// ✅ Back + Select & Continue FLOAT at bottom

import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Affirmation = { id: string; title: string; text: string };
type MusicTrack = {
  id: string;
  hz: number;
  chakra: string;
  title: string;
  url: string;
  previewUrl: string;
};

const PREVIEW_STOP_MS = 15_000;
const BOTTOM_BAR_H = 92;

// ✅ Your full + preview pairs
const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "freq_174",
    hz: 174,
    chakra: "Crown Chakra",
    title: "174 Hz — Deep Calm & Clarity",
    url: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Full/174hz.mp3",
    previewUrl: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Preview/174hzPreview.mp3",
  },
  {
    id: "freq_285",
    hz: 285,
    chakra: "Sacral Chakra",
    title: "285 Hz — Restoration & Replenish",
    url: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Full/285hz.mp3",
    previewUrl: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Preview/285hzPreview.mp3",
  },
  {
    id: "freq_396",
    hz: 396,
    chakra: "Root Chakra",
    title: "396 Hz — Grounding & Well-Being",
    url: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Full/396hz.mp3",
    previewUrl: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Preview/396hzPreview.mp3",
  },
  {
    id: "freq_417",
    hz: 417,
    chakra: "Sacral Chakra",
    title: "417 Hz — Release & Flow",
    url: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Full/417hz.mp3",
    previewUrl: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Preview/417hzPreview.mp3",
  },
  {
    id: "freq_528",
    hz: 528,
    chakra: "Solar Plexus Chakra",
    title: "528 Hz — Confidence & Transformation",
    url: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Full/528hz.mp3",
    previewUrl: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Preview/528hzPreview.mp3",
  },
  {
    id: "freq_639",
    hz: 639,
    chakra: "Heart Chakra",
    title: "639 Hz — Connection & Compassion",
    url: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Full/639hz.mp3",
    previewUrl: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Preview/639hzPreview.mp3",
  },
  {
    id: "freq_741",
    hz: 741,
    chakra: "Throat Chakra",
    title: "741 Hz — Expression & Clarity",
    url: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Full/741hz.mp3",
    previewUrl: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Preview/741hzPreview.mp3",
  },
  {
    id: "freq_852",
    hz: 852,
    chakra: "Third Eye Chakra",
    title: "852 Hz — Insight & Intuition",
    url: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Full/852hz.mp3",
    previewUrl: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Preview/852hzPreview.mp3",
  },
  {
    id: "freq_963",
    hz: 963,
    chakra: "Crown Chakra",
    title: "963 Hz — Stillness & Unity",
    url: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Full/963hz.mp3",
    previewUrl: "https://gentle-echo-audio.s3.ca-central-1.amazonaws.com/affirmations/Preview/963hzPreview.mp3",
  },
];

const TRACKS_SORTED = [...MUSIC_TRACKS].sort((a, b) => a.hz - b.hz);

export default function MusicPicker() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const affirmation: Affirmation | null = useMemo(() => {
    const raw = typeof params.affirmation === "string" ? params.affirmation : "";
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }, [params.affirmation]);

  const [selectedId, setSelectedId] = useState<string>(TRACKS_SORTED[0]?.id);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingPlay, setLoadingPlay] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();

    (async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    })();

    return () => {
      stopPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const stopPreview = async () => {
    clearStopTimer();
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
    setPlayingId(null);
  };

  const preview = async (track: MusicTrack) => {
    if (loadingPlay) return;

    if (playingId === track.id) {
      await stopPreview();
      return;
    }

    const uri = (track.previewUrl && track.previewUrl.trim()) || "";
    if (!uri) {
      Alert.alert("Missing preview URL", "This track is missing a preview URL.");
      return;
    }

    try {
      setLoadingPlay(true);
      await stopPreview();

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(track.id);

      clearStopTimer();
      stopTimerRef.current = setTimeout(async () => {
        await stopPreview();
      }, PREVIEW_STOP_MS);

      sound.setOnPlaybackStatusUpdate(async (st: any) => {
        if (st?.isLoaded && st?.didJustFinish) {
          await stopPreview();
        }
      });
    } catch (e: any) {
      Alert.alert("Preview error", String(e?.message ?? e));
      await stopPreview();
    } finally {
      setLoadingPlay(false);
    }
  };

  const onBack = () => router.back();

  const onContinue = async () => {
    const selected = TRACKS_SORTED.find((m) => m.id === selectedId) || TRACKS_SORTED[0];
    if (!affirmation || !selected) return;

    if (!selected.url || !selected.url.trim()) {
      Alert.alert("Full track missing", "This track is missing its FULL URL.");
      return;
    }

    await stopPreview();

    const payload = encodeURIComponent(
      JSON.stringify({
        affirmation,
        music: {
          id: selected.id,
          title: selected.title,
          url: selected.url,
          previewUrl: selected.previewUrl,
          hz: selected.hz,
          chakra: selected.chakra,
        },
      })
    );

    router.push(`/(app)/affirmations/review?payload=${payload}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}>
          <Text style={styles.header} numberOfLines={1}>
            Choose Your Background Music
          </Text>

          <Text style={styles.sub}>
            Select a track to play as the background music for your affirmation. Select Preview to hear a sample.
          </Text>

          <View style={styles.panel}>
            {TRACKS_SORTED.map((m) => {
              const active = m.id === selectedId;
              const isPlaying = playingId === m.id;

              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedId(m.id)}
                  style={[styles.rowCard, active && styles.rowCardActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.musicTitle, active && styles.musicTitleActive]}>{m.title}</Text>
                    <Text style={[styles.musicSub, active && styles.musicSubActive]}>{m.chakra}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => preview(m)}
                    style={[styles.previewBtn, isPlaying && styles.previewBtnActive]}
                  >
                    {loadingPlay && isPlaying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.previewText}>{isPlaying ? "Stop" : "Preview"}</Text>
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Space for bottom floating buttons */}
          <View style={{ height: BOTTOM_BAR_H + 10 }} />
        </Animated.View>
      </ScrollView>

      {/* Floating bottom buttons */}
      <View style={styles.bottomBar}>
        <View style={styles.btnRow}>
          <TouchableOpacity activeOpacity={0.9} onPress={onBack} style={[styles.btn, styles.btnGhost]}>
            <Text style={styles.btnText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} onPress={onContinue} style={[styles.btn, styles.btnPrimary]}>
            <Text style={styles.btnText}>Select &amp; Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#26384C" },
  scroll: { padding: 16, paddingBottom: 10 },
  inner: { paddingTop: 70 },

  header: {
    color: "#F2F0EA",
    fontSize: 20.5,
    fontWeight: "900",
    textAlign: "center",
  },
  sub: {
    marginTop: 8,
    color: "rgba(242,240,234,0.70)",
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 12,
    textAlign: "center",
  },

  panel: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 12,
    gap: 10,
  },

  rowCard: {
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowCardActive: {
    backgroundColor: "rgba(59,130,246,0.18)",
    borderColor: "rgba(59,130,246,0.35)",
  },

  musicTitle: {
    color: "rgba(242,240,234,0.88)",
    fontSize: 13.5,
    fontWeight: "900",
    lineHeight: 18,
  },
  musicTitleActive: { color: "#ffffff" },

  musicSub: {
    marginTop: 4,
    color: "rgba(242,240,234,0.62)",
    fontSize: 12.5,
    fontWeight: "800",
  },
  musicSubActive: { color: "rgba(255,255,255,0.78)" },

  previewBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    minWidth: 92,
  },
  previewBtnActive: {
    backgroundColor: "rgba(248,113,113,0.70)",
    borderColor: "rgba(0,0,0,0.12)",
  },
  previewText: { color: "#fff", fontSize: 13, fontWeight: "900", letterSpacing: 0.2 },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    backgroundColor: "rgba(38,56,76,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },

  btnRow: { flexDirection: "row", gap: 10 },
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
  btnText: { color: "#fff", fontSize: 13.5, fontWeight: "900", letterSpacing: 0.2, textAlign: "center" },
});
