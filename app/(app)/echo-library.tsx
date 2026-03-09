// app/(app)/echo-library.tsx — FULL REPLACEMENT
// ✅ Updated to newer Gentle Echo visual style
// ✅ Background image + dark overlay
// ✅ Modernized status tile + echo cards
// ✅ Keeps autoplay support
// ✅ Keeps play / stop / remove behavior
// ✅ Keeps top area lowered

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const ECHO_LIBRARY_JSON = "gentleecho_echo_library.json";

type EchoItem = {
  id: string;
  title: string;
  createdAt: string;
  localUri: string;
};

export default function EchoLibrary() {
  const router = useRouter();
  const params = useLocalSearchParams<{ autoplay?: string; id?: string }>();

  const soundRef = useRef<Audio.Sound | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EchoItem[]>([]);
  const [status, setStatus] = useState<string>("Ready");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const getLibraryJsonPath = () => {
    const fs: any = FileSystem as any;
    const base = fs?.documentDirectory;
    if (!base) return null;
    return `${base}${ECHO_LIBRARY_JSON}`;
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

  const writeLibrary = async (next: EchoItem[]) => {
    const path = getLibraryJsonPath();
    if (!path) return;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(next, null, 2));
  };

  const stopAndUnload = async () => {
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

  const setIdleAudioMode = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  };

  const refresh = async () => {
    setLoading(true);
    try {
      await setIdleAudioMode();
      const lib = await readLibrary();

      const pruned: EchoItem[] = [];
      for (const it of lib) {
        const info = await FileSystem.getInfoAsync(it.localUri);
        if (info.exists) pruned.push(it);
      }

      if (pruned.length !== lib.length) {
        await writeLibrary(pruned);
      }

      setItems(pruned);
      setStatus(pruned.length ? "Ready" : "No echoes yet.");
    } catch {
      setItems([]);
      setStatus("No echoes yet.");
    } finally {
      setLoading(false);
    }
  };

  const play = async (it: EchoItem) => {
    try {
      setStatus("Loading…");

      const info = await FileSystem.getInfoAsync(it.localUri);
      if (!info.exists) {
        Alert.alert("Missing file", "This echo is no longer on the device.");
        await refresh();
        return;
      }

      await stopAndUnload();
      await setIdleAudioMode();

      const { sound } = await Audio.Sound.createAsync(
        { uri: it.localUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlayingId(it.id);
      setStatus("Playing…");

      sound.setOnPlaybackStatusUpdate(async (st: any) => {
        if (st?.isLoaded && st?.didJustFinish) {
          await stopAndUnload();
          setStatus("Finished");
        }
      });
    } catch (e: any) {
      Alert.alert("Playback error", String(e?.message ?? e));
      setStatus("Playback error");
      setPlayingId(null);
    }
  };

  const remove = async (it: EchoItem) => {
    try {
      if (playingId === it.id) await stopAndUnload();

      try {
        const info = await FileSystem.getInfoAsync(it.localUri);
        if (info.exists) {
          await FileSystem.deleteAsync(it.localUri, { idempotent: true });
        }
      } catch {}

      const next = items.filter((x) => x.id !== it.id);
      setItems(next);
      await writeLibrary(next);
      setStatus(next.length ? "Ready" : "No echoes yet.");
    } catch {
      // silent
    }
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

    refresh();

    return () => {
      stopAndUnload();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const autoplay = params?.autoplay === "1";
    const id = params?.id;
    if (!autoplay || !id) return;
    if (!items.length) return;

    const target = items.find((x) => x.id === id);
    if (target) {
      play(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, params?.autoplay, params?.id]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ImageBackground
        source={require("../../assets/images/background_image.png")}
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
            <View style={styles.topOffset} />

            <View style={styles.topRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.titleWrap}>
                <Text style={styles.kicker}>Saved Voice Reflections</Text>
                <Text style={styles.title}>My Echo Library</Text>
              </View>

              <View style={{ width: 76 }} />
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Status</Text>
              <Text style={styles.statusLine}>{status}</Text>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#F2F0EA" />
              </View>
            ) : items.length ? (
              <View style={styles.cardsWrap}>
                {items.slice(0, 5).map((it) => {
                  const isPlaying = playingId === it.id;

                  return (
                    <View
                      key={it.id}
                      style={[styles.itemCard, isPlaying && styles.itemCardActive]}
                    >
                      <Text style={styles.itemTitle}>{it.title}</Text>
                      <Text style={styles.itemMeta}>
                        {new Date(it.createdAt).toLocaleString()}
                      </Text>

                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => play(it)}
                          style={[
                            styles.actionBtn,
                            styles.playBtn,
                            isPlaying ? styles.activeActionBtn : null,
                          ]}
                        >
                          <Text style={styles.actionText}>PLAY</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={stopAndUnload}
                          style={[styles.actionBtn, styles.stopBtn]}
                        >
                          <Text style={styles.actionText}>STOP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => remove(it)}
                          style={styles.deleteBtn}
                        >
                          <Text style={styles.deleteText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No echoes yet</Text>
                <Text style={styles.emptySub}>
                  Your saved voice reflections will appear here after you create them.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
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
    backgroundColor: "rgba(18, 28, 40, 0.70)",
  },

  container: {
    flex: 1,
  },

  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },

  inner: {
    flex: 1,
  },

  topOffset: {
    height: 48,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 76,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    color: "rgba(242,240,234,0.96)",
    fontWeight: "900",
    letterSpacing: 0.2,
    fontSize: 13,
  },

  titleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  kicker: {
    color: "rgba(242,240,234,0.82)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  title: {
    color: "#F2F0EA",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  statusCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  statusTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#F2F0EA",
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: 6,
  },

  statusLine: {
    fontSize: 13,
    color: "rgba(242,240,234,0.80)",
    textAlign: "center",
    lineHeight: 19,
    letterSpacing: 0.1,
  },

  loadingBox: {
    marginTop: 22,
    alignItems: "center",
  },

  cardsWrap: {
    marginTop: 16,
    gap: 12,
  },

  itemCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  itemCardActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.24)",
  },

  itemTitle: {
    color: "#F2F0EA",
    fontWeight: "900",
    letterSpacing: 0.2,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 6,
  },

  itemMeta: {
    color: "rgba(242,240,234,0.74)",
    fontWeight: "700",
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },

  btnRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  playBtn: {
    backgroundColor: "rgba(34,197,94,0.78)",
  },

  stopBtn: {
    backgroundColor: "rgba(239,68,68,0.78)",
  },

  activeActionBtn: {
    opacity: 0.88,
  },

  actionText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: 0.2,
    fontSize: 13,
  },

  deleteBtn: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  deleteText: {
    color: "rgba(242,240,234,0.94)",
    fontWeight: "900",
    letterSpacing: 0.2,
    fontSize: 12,
  },

  emptyBox: {
    marginTop: 16,
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
});