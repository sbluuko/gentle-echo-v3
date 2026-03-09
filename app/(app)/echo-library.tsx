// app/(app)/echo-library.tsx — FULL REPLACEMENT
// ✅ Back button removed
// ✅ Full header titles show
// ✅ Status tile removed
// ✅ Date line under tile title removed
// ✅ Keeps autoplay support
// ✅ Keeps play / stop / remove behavior
// ✅ Fixes useEffect cleanup error

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

const ECHO_LIBRARY_JSON = "gentleecho_echo_library.json";

type EchoItem = {
  id: string;
  title: string;
  createdAt: string;
  localUri: string;
};

export default function EchoLibrary() {
  const params = useLocalSearchParams<{ autoplay?: string; id?: string }>();

  const soundRef = useRef<Audio.Sound | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EchoItem[]>([]);
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
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const play = async (it: EchoItem) => {
    try {
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

      sound.setOnPlaybackStatusUpdate(async (st: any) => {
        if (st?.isLoaded && st?.didJustFinish) {
          await stopAndUnload();
        }
      });
    } catch (e: any) {
      Alert.alert("Playback error", String(e?.message ?? e));
      setPlayingId(null);
    }
  };

  const remove = async (it: EchoItem) => {
    try {
      if (playingId === it.id) {
        await stopAndUnload();
      }

      try {
        const info = await FileSystem.getInfoAsync(it.localUri);
        if (info.exists) {
          await FileSystem.deleteAsync(it.localUri, { idempotent: true });
        }
      } catch {}

      const next = items.filter((x) => x.id !== it.id);
      setItems(next);
      await writeLibrary(next);
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

    void refresh();

    return () => {
      void stopAndUnload();
    };
  }, [fade, lift]);

  useEffect(() => {
    const autoplay = params?.autoplay === "1";
    const id = params?.id;
    if (!autoplay || !id) return;
    if (!items.length) return;

    const target = items.find((x) => x.id === id);
    if (target) {
      void play(target);
    }
  }, [items, params?.autoplay, params?.id]);

  return (
    <AppScreen scroll>
      <Animated.View
        style={[
          styles.inner,
          { opacity: fade, transform: [{ translateY: lift }] },
        ]}
      >
        <View style={styles.topOffset} />

        <View style={styles.header}>
          <Text style={styles.kicker}>My saved Inner Wisdom messages</Text>
          <Text style={styles.title}>Inner Wisdom Library</Text>
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

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => void play(it)}
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
                      onPress={() => void stopAndUnload()}
                      style={[styles.actionBtn, styles.stopBtn]}
                    >
                      <Text style={styles.actionText}>STOP</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => void remove(it)}
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
            <Text style={styles.emptyTitle}>No Message yet</Text>
            <Text style={styles.emptySub}>
              Your saved Inner Wisdom message will appear once you have create them
            </Text>
          </View>
        )}
      </Animated.View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
  },

  topOffset: {
    height: 48,
  },

  header: {
    alignItems: "center",
  },

  kicker: {
    color: "rgba(242,240,234,0.82)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },

  title: {
    color: "#F2F0EA",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
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
    padding: 16,
  },

  itemCardActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.24)",
  },

  itemTitle: {
    color: "#F2F0EA",
    fontWeight: "900",
    fontSize: 16,
    textAlign: "center",
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
    color: "#F2F0EA",
    fontWeight: "900",
    fontSize: 12,
  },

  emptyBox: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 24,
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
    marginTop: 8,
    textAlign: "center",
    lineHeight: 19,
  },
});