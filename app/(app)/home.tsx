// app/(app)/home.tsx — NEW FILE (True Home)
// ✅ Intro + 2 buttons: Profile + Applications
// ✅ Uses push() so stack history exists (back buttons work)

import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Home" }} />

      <ImageBackground
        source={require("../../assets/images/background_image.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Welcome to Gentle Echo</Text>

            <Text style={styles.body}>
              Gentle Echo consists of three (3) sepearate applications that helps you create a personalized audio experience 
            </Text>

            <Text style={styles.body}>
              
            </Text>

            <View style={{ height: 12 }} />

            <Text style={styles.body}>
              Use the buttons below to access the applications or to manage your user profile
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => router.push("/(app)/welcome")}
          >
            <Text style={styles.btnText}>Go to Applications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => router.push("/(app)/profile")}
          >
            <Text style={styles.btnText}>Go to User Profile</Text>
          </TouchableOpacity>

          <View style={{ height: 18 }} />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1020" },
  bg: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
    flexGrow: 1,
  },

  card: {
    borderRadius: 18,
    backgroundColor: "rgba(100, 255, 255, 0.33)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 16,
    marginBottom: 14,
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