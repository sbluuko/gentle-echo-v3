// app/(app)/affirmations/script.tsx — FULL REPLACEMENT
// Step 2: Full script display
// ✅ Matches Welcome look: background_image.png + overlays + consistent glass styling
// ✅ Title centered
// ✅ Buttons FLOAT at bottom (and safe-area aware)
// ✅ "Use this Affirmation" -> "Select & Continue"
// ✅ Passes affirmation -> /affirmations/music
// ✅ Keeps your existing param parsing logic

import { useLocalSearchParams, useRouter } from "expo-router";
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

type Affirmation = { id: string; title: string; text: string };

export default function AffirmationScript() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const affirmation: Affirmation | null = useMemo(() => {
    const raw = typeof params.affirmation === "string" ? params.affirmation : "";
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }, [params.affirmation]);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  const onBack = () => router.back();

  const onUse = () => {
    if (!affirmation) return;
    const payload = encodeURIComponent(JSON.stringify(affirmation));
    router.push(`/(app)/affirmations/music?affirmation=${payload}`);
  };

  const title = affirmation?.title ?? "Affirmation";
  const body = affirmation?.text ?? "Missing affirmation text.";

  // Safe, predictable bottom bar sizing across devices
  const bottomPad = Math.max(14, insets.bottom + 12);
  const bottomBarH = 76 + bottomPad; // 76 content + safe padding

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ImageBackground
        source={require("../../../assets/images/background_image.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}>
          <View style={styles.headerTile}>
            <Text style={styles.header}>{title}</Text>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomBarH + 18 }]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.card}>
              <Text style={styles.script}>{body}</Text>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Floating bottom buttons (safe-area aware) */}
        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
          <View style={styles.btnRow}>
            <TouchableOpacity activeOpacity={0.9} onPress={onBack} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnText}>Return to List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onUse}
              disabled={!affirmation}
              style={[styles.btn, styles.btnPrimary, !affirmation && styles.btnDisabled]}
            >
              <Text style={styles.btnText}>Select &amp; Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const COLORS = {
  text: "#F2F0EA",
  textSoft: "rgba(242,240,234,0.84)",
  textDim: "rgba(242,240,234,0.70)",
  border: "rgba(255,255,255,0.14)",
  panel: "rgba(19,167,154,0.70)",
  panelBorder: "rgba(255,255,255,0.14)",
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

  inner: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

  headerTile: {
    borderRadius: 18,
    backgroundColor: "rgba(155,255,255,0.25)",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  header: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  scroll: {
    paddingHorizontal: 0,
  },

  card: {
    borderRadius: 16,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    padding: 16,
  },

  script: {
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "600",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "rgba(15,20,35,0.78)",
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

  btnGhost: {
    backgroundColor: COLORS.btnBg,
    borderColor: COLORS.btnBorder,
  },

  btnDisabled: { opacity: 0.55 },

  btnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});