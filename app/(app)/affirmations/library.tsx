// app/(app)/affirmations/library.tsx — FULL REPLACEMENT
// ✅ Updated to newer Gentle Echo visual style
// ✅ Background image + dark overlay
// ✅ Modernized cards / tiles
// ✅ Keeps active-card-only slider
// ✅ Keeps interruption handling + playback controls
// ✅ Keeps create button routing

import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

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

      setPositionMs(0);
      setDurationMs(1);
      setIsSeeking(false);

      sound.setOnPlaybackStatusUpdate((s: any) => {
        if (!s?.isLoaded) return;

        if (!isSeeking) {
          if (typeof s.positionMillis === "number") {
            setPositionMs(s.positionMillis);
          }
        }

        if (typeof s.durationMillis === "number" && s.durationMillis > 0) {
          setDurationMs(s.durationMillis);
        }

        if (s?.shouldPlay && !s?.isPlaying && !s?.didJustFinish) {
          setPaused(true);
          isPlayingNowRef.current = false;
        }

        if (s?.didJustFinish) {
          stopAndUnload();
        }
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
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ImageBackground
        source={require("../../../assets/images/background_image.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.bgDarken} />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.inner,
              { opacity: fade, transform: [{ translateY: lift }] },
            ]}
          >
            <Text style={styles.kicker}>Your Personal Collection</Text>
            <Text style={styles.header}>My Affirmation Library</Text>
            <Text style={styles.subheader}>
              Listen back to your saved affirmations whenever you need calm, clarity, or rest.
            </Text>

            <View style={{ height: 18 }} />

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#F2F0EA" />
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No affirmations yet</Text>
                <Text style={styles.emptySub}>
                  Create your first affirmation to begin building your personal library.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsWrap}>
                {items.map((it) => {
                  const active = activeId === it.id;
                  const max = Math.max(1, durationMs || 1);
                  const val = Math.max(0, Math.min(positionMs, max));

                  return (
                    <View key={it.id} style={[styles.card, active && styles.cardActive]}>
                      <Text style={styles.title}>{it.title}</Text>
                      <Text style={styles.meta}>Music: {it.music_title}</Text>
                      <Text style={styles.meta}>
                        Created: {new Date(it.created_at).toLocaleString()}
                      </Text>

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

            <View style={{ height: 24 }} />

            <TouchableOpacity
              onPress={() => router.push("/(app)/affirmations/create")}
              style={styles.createBtn}
              activeOpacity={0.9}
            >
              <Text style={styles.createText}>Create Another Affirmation</Text>
            </TouchableOpacity>

            <View style={{ height: 34 }} />
          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
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
      activeOpacity={0.85}
    >
      <Text style={[styles.icon, { color: props.color }]}>{props.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#26384C",
  },

  bg: {
    flex: 1,
  },

  bgDarken: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 28, 40, 0.78)",
  },

  container: {
    flex: 1,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  inner: {
    flex: 1,
    paddingTop: 44,
  },

  kicker: {
    color: "rgba(242,240,234,0.82)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.4,
    marginBottom: 6,
  },

  header: {
    color: "#F2F0EA",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  subheader: {
    color: "rgba(242,240,234,0.78)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 10,
  },

  loadingBox: {
    marginTop: 10,
    paddingVertical: 28,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  emptyBox: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  emptyTitle: {
    color: "#F2F0EA",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  emptySub: {
    color: "rgba(242,240,234,0.75)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: "center",
  },

  cardsWrap: {
    gap: 14,
  },

  card: {
    borderRadius: 18,
    backgroundColor: "rgba(19,167,154,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 16,
  },

  cardActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.24)",
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
    color: "rgba(242,240,234,0.80)",
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
  },

  trackerWrap: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
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
    color: "rgba(242,240,234,0.72)",
    fontSize: 12,
    fontWeight: "800",
  },

  iconRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },

  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    fontSize: 32,
  },

  disabled: {
    opacity: 0.4,
  },

  createBtn: {
    height: 58,
    borderRadius: 16,
    backgroundColor: "rgba(37,99,235,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },

  createText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});