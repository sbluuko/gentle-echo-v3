// app/(app)/_layout.tsx — FULL REPLACEMENT (REFLECTIONS ONLY)
// ✅ Global header uses text-only "Previous Screen" instead of arrow
// ✅ Train page still has no header/back path once overridden in train.tsx
// ✅ Home redirect after training
// ✅ Auth + profile gate preserved

import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useProfile } from "../../lib/useProfile";
import { useSession } from "../../lib/useSession";

function isTrainingComplete(
  profile: { voice_id: string | null; voice_ready: boolean | null } | null
) {
  if (!profile) return false;
  if (profile.voice_ready === true) return true;
  if (profile.voice_id && profile.voice_id.length > 0) return true;
  return false;
}

function AppLayoutInner() {
  const router = useRouter();
  const segments = useSegments();

  const routeName = useMemo(() => {
    const last = Array.isArray(segments) ? segments[segments.length - 1] : "";
    return typeof last === "string" ? last : "";
  }, [segments]);

  const { session, isLoading: sessionLoading } = useSession();
  const { profile, isLoading: profileLoading } = useProfile();

  const isLoading = sessionLoading || profileLoading;
  const trainingDone = isTrainingComplete(profile);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace("/(auth)");
      return;
    }

    if (!trainingDone && routeName !== "train") {
      router.replace("/(app)/train");
      return;
    }

    if (trainingDone && routeName === "train") {
      router.replace("/(app)/home");
      return;
    }
  }, [isLoading, session, trainingDone, routeName, router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={({ navigation, route }) => ({
          headerShown: true,
          headerBackVisible: false,
          headerTitle: "",
          headerTintColor: "#F2F0EA",
          headerStyle: { backgroundColor: "#26384C" },
          headerTitleStyle: { fontWeight: "900" },
          headerShadowVisible: false,
          headerLeft: () => {
            if (!navigation.canGoBack()) return null;
            if (route.name === "home") return null;
            if (route.name === "train") return null;

            return (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingVertical: 6, paddingRight: 8 }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: "#F2F0EA",
                    fontWeight: "900",
                    fontSize: 14,
                  }}
                >
                  ← Go to Previous Screen
                </Text>
              </TouchableOpacity>
            );
          },
        })}
      />

      {isLoading ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  );
}

export default function AppLayout() {
  return (
    <SafeAreaProvider>
      <AppLayoutInner />
    </SafeAreaProvider>
  );
}