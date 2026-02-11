// app/(auth)/_layout.tsx — FULL REPLACEMENT
// ✅ SafeAreaProvider added (harmless, keeps screens consistent)

import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function AuthLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
