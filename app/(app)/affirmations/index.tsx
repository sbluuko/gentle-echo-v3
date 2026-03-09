// app/(app)/affirmations/index.tsx — FULL REPLACEMENT
// ✅ Uses global AppScreen (background + safe-area + padding + scroll)
// ✅ Uses global AppButton for consistent buttons
// ✅ Keeps your existing content + step wrap alignment

import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/AppButton";
import AppScreen from "../../../components/AppScreen";

export default function AffirmationsHome() {
  const router = useRouter();

  return (
    <AppScreen scroll>
      <View style={styles.block}>
        <Text style={styles.title}>AFFIRMATIONS</Text>

        {/* Background tile behind ALL text */}
        <View style={styles.textTile}>
          <Text style={styles.subCenter}>
            This app allows you to create personalized affirmations
          </Text>

          <View style={styles.spacerLg} />

          <Text style={styles.subCenter}>
            Each affirmation blends a carefully written script with a background frequency
            to encourage the mind to engage more deeply with the message
          </Text>

          <View style={styles.spacerLg} />

          <Text style={styles.subCenter}>
            Creating an affirmation takes just three easy steps:
          </Text>

          <View style={styles.spacerLg} />

          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>
              Select the CREATE AN AFFIRMATION button below
            </Text>
          </View>

          <View style={styles.spacerLg} />

          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>
              Select an affirmation script from the catalogue page
            </Text>
          </View>

          <View style={styles.spacerSm} />

          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>
              Select the desired background music from the catalogue of chakra frequencies
            </Text>
          </View>

          <View style={styles.spacerLg} />
          <View style={styles.spacerLg} />

          <Text style={styles.subCenter}>
            That's all. Your affirmation will be automatically generated and saved to your personal
            affirmation library and ready for you to listen to at anytime
          </Text>
        </View>

        <AppButton
          title="Create an Affirmation"
          onPress={() => router.push("/(app)/affirmations/create")}
          variant="primary"
          style={{ marginTop: 14 }}
        />

        <AppButton
          title="Go To My Affirmation Library"
          onPress={() => router.push("/(app)/affirmations/library")}
          variant="secondary"
          style={{ marginTop: 12 }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingTop: 6,
    gap: 14,
  },

  title: {
    color: "#F2F0EA",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
    marginTop: 6,
  },

  textTile: {
    borderRadius: 18,
    backgroundColor: "rgba(19,167,154,0.70)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 16,
  },

  subCenter: {
    color: "rgba(242,240,234,0.88)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "700",
  },

  spacerLg: { height: 14 },
  spacerSm: { height: 10 },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 24,
    color: "rgba(242,240,234,0.92)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
  },
  stepText: {
    flex: 1,
    color: "rgba(242,240,234,0.88)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "left",
  },
});