// app/(app)/affirmations/index.tsx — FULL REPLACEMENT
// ✅ Center title + centered paragraphs
// ✅ Text sits inside a background tile
// ✅ Adds spacing between specific paragraphs + step lines
// ✅ Steps are LEFT-justified AND wrap-align under the step text (not under the number)
// ✅ Library button is a different blue than Create button

import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AffirmationsHome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>AFFIRMATIONS</Text>

        {/* Background tile behind ALL text */}
        <View style={styles.textTile}>
          <Text style={styles.subCenter}>This app allows you to create personalized affirmations</Text>

          <View style={styles.spacerLg} />

          <Text style={styles.subCenter}>
            Each affirmation blends a carefully written script with a subtle background frequency to encourage the mind
            to engage more deeply with the message
          </Text>

          <View style={styles.spacerLg} />
          <View style={styles.spacerLg} />

          <Text style={styles.subCenter}>Creating an affirmation takes just a couple of simple steps:</Text>

          <View style={styles.spacerLg} />

          {/* ✅ Proper step alignment (wrapped lines align under text, not the number) */}
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>Select an affirmation script from the catalogue</Text>
          </View>

          <View style={styles.spacerSm} />

          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>
              Choose the desired background music from the catalogue of chakra frequencies
            </Text>
          </View>

          <View style={styles.spacerLg} />
          <View style={styles.spacerLg} />

          <Text style={styles.subCenter}>
            That's all. Your affirmation will be automatically generated and saved to your personal affirmation library,
            ready to listen to at anytime
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/(app)/affirmations/create")}
          style={styles.btnPrimary}
        >
          <Text style={styles.btnText}>Create an Affirmation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/(app)/affirmations/library")}
          style={styles.btnSecondary}
        >
          <Text style={styles.btnText}>Go To My Affirmation Library</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#26384C" },
  inner: { flex: 1, paddingTop: 70, paddingHorizontal: 18, gap: 14 },

  title: {
    color: "#F2F0EA",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  // Tile behind ALL text
  textTile: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 16,
  },

  subCenter: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "600",
  },

  spacerLg: { height: 14 },
  spacerSm: { height: 8 },

  // ✅ Numbered steps that wrap correctly
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 24, // controls indent; increase to 26/28 if you want more gap
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "left",
  },

  btnPrimary: {
    height: 62,
    borderRadius: 16,
    backgroundColor: "rgba(59,130,246,0.78)", // Create button blue
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  btnSecondary: {
    height: 62,
    borderRadius: 16,
    backgroundColor: "rgba(37,99,235,0.80)", // Different blue for Library
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
