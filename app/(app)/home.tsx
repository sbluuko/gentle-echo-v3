// app/(app)/home.tsx — FULL REPLACEMENT
// ✅ Keeps ALL text
// ✅ Removes tile behind title + text
// ✅ Keeps clean spacing
// ✅ Removes Previous Screen from grey header
// ✅ Removes back arrow completely
// ✅ Uses global AppScreen wrapper

import { Stack, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AppScreen from "../../components/AppScreen";

export default function Home() {
  const router = useRouter();

  return (
    <AppScreen scroll>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerBackTitle: "",
          title: "",
        }}
      />

      <View style={styles.textWrap}>
        <View style={{ height: 40 }} />
        <Text style={styles.title}>Welcome to Inner Wisdom</Text>

        <View style={{ height: 10 }} />

        <Text style={styles.body}>
          Inner Wisdom is a private space to record your spoken thoughts and hear them played back with calm clarity
        </Text>

        <View style={{ height: 20 }} />

        <Text style={styles.body}>
          Listening to your own voice quiets the inner noise and brings you back to what truly matters the most
        </Text>

        <View style={{ height: 20 }} />

        <Text style={styles.body}>
          Inner Wisdom turns your thoughts into a steady grounding practice you can return to at anytime
        </Text>

        <View style={{ height: 20 }} />

        <Text style={styles.body}>
          Use the buttons below to access the Inner Wisdom application or to manage
          your user profile.
        </Text>

        <View style={{ height: 30 }} />

      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.btn, styles.btnPrimary]}
        onPress={() => router.push("/(app)/main")}
      >
        <Text style={styles.btnText}>Go to Your Inner Wisdom App</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />

      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.btn, styles.btnSecondary]}
        onPress={() => router.push("/(app)/profile")}
      >
        <Text style={styles.btnText}>Go to Your User Profile</Text>
      </TouchableOpacity>

      <View style={{ height: 18 }} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  textWrap: {
    marginBottom: 18,
    paddingHorizontal: 6,
  },

  title: {
    color: "#F2F0EA",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  body: {
    color: "rgba(242,240,234,0.85)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "700",
  },

  btn: {
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginTop: 12,
  },

  btnPrimary: {
    backgroundColor: "rgba(99, 140, 255, 0.55)",
    borderColor: "rgba(255,255,255,0.18)",
  },

  btnSecondary: {
    backgroundColor: "rgba(99,255,255,0.25)",
    borderColor: "rgba(255,255,255,0.18)",
  },

  btnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});