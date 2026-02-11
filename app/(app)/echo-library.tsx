// app/(app)/echo-library.tsx — FULL REPLACEMENT
// ✅ Move Back button + everything down ~1/2 inch (~48px)

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const ECHO_LIBRARY_JSON = "gentleecho_echo_library.json";

type EchoItem = {
  id: string;
  title: string;
  createdAt: string;
  localUri: string;
};

const COLORS = {
  dusk: "#26384C",
  text: "#F2F0EA",
  textSoft: "rgba(242,240,234,0.82)",
  textDim: "rgba(242,240,234,0.70)",
  panel: "rgba(255,255,255,0.12)",
  panelBorder: "rgba(255,255,255,0.14)",
  play: "rgba(52,211,153,0.70)",
  stop: "rgba(248,113,113,0.75)",
};

export default function EchoLibrary() {
  const router = useRouter();
  const params = useLocalSearchParams<{ autoplay?: string; id?: string }>();

  const soundRef = useRef<Audio.Sound | null>(null);

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

      // prune missing files
      const pruned: EchoItem[] = [];
      for (const it of lib) {
        const info = await FileSystem.getInfoAsync(it.localUri);
        if (info.exists) pruned.push(it);
      }
      if (pruned.length !== lib.length) await writeLibrary(pruned);

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
    if (target) play(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, params?.autoplay, params?.id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* ✅ Push everything down ~1/2 inch */}
        <View style={styles.topOffset} />

        <View style={styles.topRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>My Echo Library</Text>

          <View style={{ width: 68 }} />
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status</Text>
          <Text style={styles.statusLine}>{status}</Text>
        </View>

        {loading ? (
          <View style={{ marginTop: 18, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            style={{ marginTop: 14 }}
            contentContainerStyle={{ paddingBottom: 22 }}
          >
            {items.slice(0, 5).map((it) => (
              <View key={it.id} style={styles.itemCard}>
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
                      { backgroundColor: COLORS.play },
                      playingId === it.id ? { opacity: 0.85 } : null,
                    ]}
                  >
                    <Text style={styles.actionText}>PLAY</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={stopAndUnload}
                    style={[styles.actionBtn, { backgroundColor: COLORS.stop }]}
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
            ))}

            {!items.length ? (
              <View style={{ marginTop: 12, alignItems: "center" }}>
                <Text style={{ color: COLORS.textDim, fontWeight: "800" }}>
                  No echoes yet.
                </Text>
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dusk },
  container: {
    flex: 1,
    backgroundColor: COLORS.dusk,
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  // ~1/2 inch
  topOffset: { height: 48 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },

  backBtn: {
    width: 68,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  backText: {
    color: "rgba(242,240,234,0.95)",
    fontWeight: "900",
    letterSpacing: 0.2,
    fontSize: 13,
  },

  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  statusCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: 6,
  },
  statusLine: {
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: "center",
    lineHeight: 19,
    letterSpacing: 0.1,
  },

  itemCard: {
    borderRadius: 16,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  itemTitle: {
    color: COLORS.text,
    fontWeight: "900",
    letterSpacing: 0.2,
    fontSize: 14,
    marginBottom: 4,
  },
  itemMeta: {
    color: COLORS.textDim,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 10,
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
  actionText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: 0.2,
    fontSize: 13,
  },

  deleteBtn: {
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  deleteText: {
    color: "rgba(242,240,234,0.92)",
    fontWeight: "900",
    letterSpacing: 0.2,
    fontSize: 12,
  },
});
