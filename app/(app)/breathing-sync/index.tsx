// app/(app)/breathing-sync/index.tsx — FULL REPLACEMENT
// ✅ 4 breathing patterns as tiles (distinct colors)
// ✅ Navigates to session with pattern param
// ✅ Matches your Welcome look: background_image.png + dark overlays + glass tiles + consistent spacing
// ✅ Safe-area aware + scroll-safe

import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type PatternId = "box" | "478" | "calm" | "reset";

export default function BreathingSyncIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          color: "rgba(47,74,115,0.60)",
        },
        {
          id: "478" as const,
          title: "BEDTIME BREATHING",
          description:
            "Downshifts your body fast. Calm racing thoughts and ease into sleep.",
          color: "rgba(75,63,114,0.60)",
        },
        {
          id: "calm" as const,
          title: "CALM FLOW",
          description: "Smooth and simple. A gentle rhythm to reduce tension.",
          color: "rgba(46,106,120,0.60)",
        },
        {
          id: "reset" as const,
          title: "RESET BREATH",
          description:
            "A deeper reset. Helps release stress while keeping a grounded pace.",
          color: "rgba(75,107,61,0.60)",
        },
      ] as const,
    []
  );

  const go = (id: PatternId) => {
    router.push(`/(app)/breathing-sync/session?pattern=${id}` as any);
  };

  const bottomPad = Math.max(18, insets.bottom + 14);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ImageBackground
        source={require("../../../assets/images/background_image.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* Match Welcome-style dim overlays */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 16 }]}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}>
            <Text style={styles.title}>BREATH-SYNC</Text>
            <Text style={styles.sub}>Choose a breathing pattern</Text>

            <View style={{ height: 18 }} />

            {patterns.map((p) => (
              <View key={p.id} style={[styles.card, { backgroundColor: p.color }]}>
                <Text style={styles.cardTitle}>{p.title}</Text>

                <View style={styles.cardRow}>
                  <Text style={styles.cardDesc}>{p.description}</Text>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => go(p.id)}
                    style={styles.selectBtn}
                  >
                    <Text style={styles.selectText}>SELECT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={{ height: 10 }} />
          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const COLORS = {
  text: "#F2F0EA",
  textDim: "rgba(242,240,234,0.74)",
  border: "rgba(255,255,255,0.14)",
  btnBg: "rgba(255,255,255,0.16)",
  btnBorder: "rgba(255,255,255,0.18)",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1020" },
  bg: { flex: 1 },

  overlayTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  overlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
    backgroundColor: "rgba(0,0,0,0.32)",
  },

  scroll: { padding: 16 },
  inner: { paddingTop: 10 },

  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 14,
    marginBottom: 10,
    letterSpacing: 0.2,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 12,
    textAlign: "center",
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardDesc: {
    flex: 0.6,
    color: "rgba(242,240,234,0.86)",
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
  },

  selectBtn: {
    flex: 0.4,
    height: 44,
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