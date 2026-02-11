// app/(app)/affirmations/script.tsx — FULL REPLACEMENT
// Step 2: Full script display
// ✅ Title centered
// ✅ Buttons FLOAT at bottom
// ✅ "Use this Affirmation" -> "Select & Continue"
// ✅ Passes affirmation -> /affirmations/music

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Affirmation = { id: string; title: string; text: string };

const BOTTOM_BAR_H = 92;

export default function AffirmationScript() {
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

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}>
        <Text style={styles.header}>{title}</Text>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.script}>{body}</Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Floating bottom buttons */}
      <View style={styles.bottomBar}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#26384C" },
  inner: { flex: 1, paddingTop: 70 },

  header: {
    color: "#F2F0EA",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingBottom: BOTTOM_BAR_H + 18,
  },

  card: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 16,
  },

  script: {
    color: "rgba(242,240,234,0.86)",
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
  btnDisabled: { opacity: 0.55 },
  btnText: { color: "#fff", fontSize: 13.5, fontWeight: "900", letterSpacing: 0.2, textAlign: "center" },
});
