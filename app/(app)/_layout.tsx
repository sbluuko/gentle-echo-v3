// app/(app)/_layout.tsx — FULL REPLACEMENT
// ✅ Global header uses text-only "Go to Previous Screen" instead of arrow
// ✅ Train page still has no header/back path once overridden in train.tsx
// ✅ FIX: layout only handles auth gate
// ✅ FIX: removes training redirect logic that can fight with train/home flow
// ✅ Prevents flicker caused by stale profile state during post-training navigation

import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useSession } from "../../lib/useSession";

function AppLayoutInner() {
  const router = useRouter();
  const { session, isLoading } = useSession();

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace("/(auth)");
    }
  }, [isLoading, session, router]);

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