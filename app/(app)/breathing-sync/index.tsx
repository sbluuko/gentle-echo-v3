// app/(app)/breathing-sync/index.tsx — FULL REPLACEMENT
// ✅ 4 breathing patterns as tiles (distinct colors)
// ✅ Navigates to session with pattern param
// ✅ Uses DEFAULT system TTS (expo-speech) in session (optional toggle)

import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PatternId = "box" | "478" | "calm" | "reset";

export default function BreathingSyncIndex() {
  const router = useRouter();

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  const patterns = useMemo(
    () =>
      [
        {
          id: "box" as const,
          title: "BOX BREATHING",
          description:
            "Balances your nervous system. Great for focus and regaining control quickly.",
          color: "#2F4A73",
        },
        {
          id: "478" as const,
          title: "BEDTIME BREATHING",
          description:
            "Downshifts your body fast. Calm racing thoughts and ease into sleep.",
          color: "#4B3F72",
        },
        {
          id: "calm" as const,
          title: "CALM FLOW",
          description:
            "Smooth and simple. A gentle rhythm to reduce tension.",
          color: "#2E6A78",
        },
        {
          id: "reset" as const,
          title: "RESET BREATH",
          description:
            "A deeper reset. Helps release stress while keeping a grounded pace.",
          color: "#4B6B3D",
        },
      ] as const,
    []
  );

  const go = (id: PatternId) => {
    router.push(`/breathing-sync/session?pattern=${id}` as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
          <Text style={styles.title}>BREATH-SYNC</Text>
          <Text style={styles.sub}>
            Choose a breating pattern
          </Text>

          <View style={{ height: 18 }} />

          {patterns.map((p) => (
            <View key={p.id} style={[styles.card, { backgroundColor: p.color }]}>
              <Text style={styles.cardTitle}>{p.title}</Text>
              <Text style={styles.cardDesc}>{p.description}</Text>

              <View style={{ height: 12 }} />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => go(p.id)}
                style={styles.selectBtn}
              >
                <Text style={styles.selectText}>SELECT</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 24 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const COLORS = {
  bg: "#1F2543",
  text: "#F2F0EA",
  textDim: "rgba(242,240,234,0.74)",
  btnBg: "rgba(255,255,255,0.18)",
  btnBorder: "rgba(255,255,255,0.25)",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },

  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  sub: {
    color: COLORS.textDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 6,
  },

  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginBottom: 10,
    textAlign: "center",
  },
  cardDesc: {
    color: "rgba(242,240,234,0.9)",
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
  },

  selectBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.btnBg,
    borderWidth: 1,
    borderColor: COLORS.btnBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  selectText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});
