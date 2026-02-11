// app/(app)/affirmations/library.tsx — FULL REPLACEMENT
// ✅ Slider/tracker ONLY on the active (currently playing) card
// ✅ Live position + duration tracking
// ✅ Scrub to seek (onSlidingComplete)
// ✅ Keeps your interruption handling + existing controls

import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

import {
  attachInterruptionHandlers,
  configureGlobalAudioModeOnce,
} from "../../../lib/audioFocus";

const LIBRARY_META_PATH =
  (FileSystem as any).documentDirectory + "affirmations_library.json";

type LibraryItem = {
  id: string;
  created_at: string;
  title: string;
  music_title: string;
  local_path: string;
};

async function readLibrary(): Promise<LibraryItem[]> {
  try {
    const info = await FileSystem.getInfoAsync(LIBRARY_META_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(LIBRARY_META_PATH);
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function fmtTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${m}:${ss}`;
}

export default function AffirmationsLibrary() {
  const router = useRouter();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  // ✅ Slider state (active card only)
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(1);

  // prevent slider value fighting with onPlaybackStatusUpdate while dragging
  const [isSeeking, setIsSeeking] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  // Track "is playing now" reliably
  const isPlayingNowRef = useRef(false);

  const stopAndUnload = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
      }
    } catch {}
    soundRef.current = null;

    setActiveId(null);
    setPaused(false);
    isPlayingNowRef.current = false;

    // reset slider
    setPositionMs(0);
    setDurationMs(1);
    setIsSeeking(false);
  };

  const pause = async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.pauseAsync();
    } catch {}
    setPaused(true);
    isPlayingNowRef.current = false;
  };

  const resume = async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.playAsync();
    } catch {}
    setPaused(false);
    isPlayingNowRef.current = true;
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();

    (async () => {
      await configureGlobalAudioModeOnce().catch(() => {});
      setItems(await readLibrary());
      setLoading(false);
    })();

    // Attach interruption handling
    const detach = attachInterruptionHandlers({
      pause,
      resume,
      isPlayingNow: () => isPlayingNowRef.current,
    });

    return () => {
      detach();
      stopAndUnload();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = async (it: LibraryItem) => {
    try {
      // If same card + paused -> resume
      if (activeId === it.id && paused && soundRef.current) {
        await resume();
        return;
      }

      await stopAndUnload();

      const { sound } = await Audio.Sound.createAsync(
        { uri: it.local_path },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setActiveId(it.id);
      setPaused(false);
      isPlayingNowRef.current = true;

      // reset slider
      setPositionMs(0);
      setDurationMs(1);
      setIsSeeking(false);

      sound.setOnPlaybackStatusUpdate((s: any) => {
        if (!s?.isLoaded) return;

        // update time tracking (don’t fight user while dragging)
        if (!isSeeking) {
          if (typeof s.positionMillis === "number") setPositionMs(s.positionMillis);
        }
        if (typeof s.durationMillis === "number" && s.durationMillis > 0) {
          setDurationMs(s.durationMillis);
        }

        // If system interrupted playback, mark paused so app can resume gracefully later
        if (s?.shouldPlay && !s?.isPlaying && !s?.didJustFinish) {
          setPaused(true);
          isPlayingNowRef.current = false;
        }

        if (s?.didJustFinish) stopAndUnload();
      });
    } catch (e: any) {
      Alert.alert("Playback error", String(e?.message ?? e));
      stopAndUnload();
    }
  };

  const seekTo = async (ms: number) => {
    try {
      if (!soundRef.current) return;
      const v = Math.max(0, Math.min(ms, durationMs || 1));
      await soundRef.current.setPositionAsync(Math.floor(v));
      setPositionMs(Math.floor(v));
    } catch {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Animated.View
        style={[
          styles.inner,
          { opacity: fade, transform: [{ translateY: lift }] },
        ]}
      >
        <Text style={styles.header}>My Affirmation Library</Text>
        <View style={{ height: 14 }} />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No affirmations yet</Text>
            <Text style={styles.emptySub}>Create one to start your library.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {items.map((it) => {
              const active = activeId === it.id;
              const max = Math.max(1, durationMs || 1);
              const val = Math.max(0, Math.min(positionMs, max));

              return (
                <View key={it.id} style={styles.card}>
                  <Text style={styles.title}>{it.title}</Text>
                  <Text style={styles.meta}>Music: {it.music_title}</Text>
                  <Text style={styles.meta}>
                    Created: {new Date(it.created_at).toLocaleString()}
                  </Text>

                  {/* ✅ Slider ONLY for active card */}
                  {active ? (
                    <View style={styles.trackerWrap}>
                      <Slider
                        style={{ width: "100%" }}
                        minimumValue={0}
                        maximumValue={max}
                        value={val}
                        onSlidingStart={() => setIsSeeking(true)}
                        onValueChange={(v) => setPositionMs(Math.floor(v))}
                        onSlidingComplete={async (v) => {
                          await seekTo(Number(v));
                          setIsSeeking(false);
                        }}
                        minimumTrackTintColor="rgba(242,240,234,0.95)"
                        maximumTrackTintColor="rgba(255,255,255,0.20)"
                        thumbTintColor="rgba(242,240,234,0.95)"
                      />
                      <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{fmtTime(val)}</Text>
                        <Text style={styles.timeText}>{fmtTime(max)}</Text>
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.iconRow}>
                    <IconBtn label="▶️" color="#22c55e" onPress={() => play(it)} />
                    <IconBtn
                      label="⏸"
                      color="#f59e0b"
                      disabled={!active || paused}
                      onPress={pause}
                    />
                    <IconBtn
                      label="⏹"
                      color="#ef4444"
                      disabled={!active}
                      onPress={stopAndUnload}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 26 }} />
        <TouchableOpacity
          onPress={() => router.push("/(app)/affirmations/create")}
          style={styles.createBtn}
        >
          <Text style={styles.createText}>Create Another Affirmation</Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </Animated.View>
    </ScrollView>
  );
}

function IconBtn(props: {
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      disabled={props.disabled}
      style={[styles.iconBtn, props.disabled && styles.disabled]}
    >
      <Text style={[styles.icon, { color: props.color }]}>{props.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#26384C" },
  scroll: { padding: 16, paddingBottom: 40 },
  inner: { paddingTop: 52 },
  header: { color: "#F2F0EA", fontSize: 22, fontWeight: "900", textAlign: "center" },

  createBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(59,130,246,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  createText: { color: "#fff", fontSize: 14, fontWeight: "900" },

  loadingBox: { paddingVertical: 24, alignItems: "center" },

  emptyBox: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 16,
    alignItems: "center",
  },
  emptyTitle: { color: "#F2F0EA", fontSize: 14, fontWeight: "900" },
  emptySub: {
    color: "rgba(242,240,234,0.7)",
    fontSize: 12.5,
    marginTop: 6,
    textAlign: "center",
  },

  card: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 14,
  },
  title: {
    color: "#F2F0EA",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  meta: {
    marginTop: 6,
    color: "rgba(242,240,234,0.78)",
    fontSize: 12.5,
    textAlign: "center",
  },

  trackerWrap: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  timeRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: "rgba(242,240,234,0.70)",
    fontSize: 12,
    fontWeight: "800",
  },

  iconRow: { marginTop: 16, flexDirection: "row", justifyContent: "center", gap: 24 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { fontSize: 32 },
  disabled: { opacity: 0.4 },
});
