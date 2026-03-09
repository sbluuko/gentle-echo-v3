// app/_layout.tsx — FULL REPLACEMENT
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { Text, TextInput } from "react-native";

// ✅ Global: stop iOS Dynamic Type from blowing up layouts
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.allowFontScaling = false;
(Text as any).defaultProps.maxFontSizeMultiplier = 1;

(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.allowFontScaling = false;
(TextInput as any).defaultProps.maxFontSizeMultiplier = 1;

export default function RootLayout() {
  useEffect(() => {
    let isMounted = true;

    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });

        console.log("✅ Global audio session initialized");
      } catch (error) {
        console.log("❌ Global audio session init failed:", error);
      }
    };

    if (isMounted) {
      initAudio();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}