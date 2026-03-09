// app/(auth)/_layout.tsx — FULL REPLACEMENT
// ✅ Hides headers on all auth screens (login/signup/forgot-password)

import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}