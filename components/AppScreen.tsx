// components/AppScreen.tsx — NEW FILE
// ✅ One global wrapper for: background + overlay + safe-area + padding + optional scroll
// ✅ Use on EVERY app screen for consistent look on iPhone + Android

import React from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  scroll?: boolean;          // default true
  contentStyle?: ViewStyle;  // optional extra styling for inner content
};

export default function AppScreen({ children, scroll = true, contentStyle }: Props) {
  const Content = (
    <View style={[styles.inner, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ImageBackground
        source={require("../assets/images/background_image.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {Content}
          </ScrollView>
        ) : (
          <View style={styles.scroll}>{Content}</View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1020" },
  bg: { flex: 1 },

  overlayTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "50%",
    backgroundColor: "rgba(0,0,0,0.70)",
  },
  overlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
    backgroundColor: "rgba(0,0,0,0.70)",
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
  },

  inner: {
    width: "100%",
    alignSelf: "center",
    maxWidth: 520, // ✅ keeps tablets and large phones consistent
  },
});