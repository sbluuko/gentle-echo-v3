// app/(app)/_layout.tsx — FULL REPLACEMENT
// ✅ Adds in-app Account Deletion (Apple 5.1.1(v))
// ✅ Uses Supabase Edge Function: delete-account
// ✅ Keeps your existing SafeAreaProvider + overlay buttons behavior intact

import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../../lib/supabase";
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
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const routeName = useMemo(() => {
    const last = Array.isArray(segments) ? segments[segments.length - 1] : "";
    return typeof last === "string" ? last : "";
  }, [segments]);

  const { session, isLoading: sessionLoading } = useSession();
  const { profile, isLoading: profileLoading } = useProfile();

  const isLoading = sessionLoading || profileLoading;
  const trainingDone = isTrainingComplete(profile);

  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const onLogout = async () => {
    if (loggingOut || deletingAccount) return;
    try {
      setLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/(auth)");
    } catch (e: any) {
      Alert.alert("Logout failed", String(e?.message ?? e));
    } finally {
      setLoggingOut(false);
    }
  };

  const onDeleteAccount = () => {
    if (loggingOut || deletingAccount) return;

    Alert.alert(
      "Delete account?",
      "This permanently deletes your account and profile. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm deletion",
              "Are you sure you want to permanently delete your account?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, delete my account",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      setDeletingAccount(true);

                      const { error } = await supabase.functions.invoke("delete-account");
                      if (error) {
                        throw new Error(error.message || "Delete failed");
                      }

                      await supabase.auth.signOut().catch(() => {});
                      router.replace("/(auth)");
                    } catch (e: any) {
                      Alert.alert(
                        "Delete failed",
                        String(e?.message ?? e) ||
                          "Could not delete your account. Please try again."
                      );
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const onHome = () => router.replace("/(app)/welcome");

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace("/(auth)");
      return;
    }

    if (trainingDone && routeName === "train") {
      router.replace("/(app)/welcome");
      return;
    }
  }, [isLoading, session, trainingDone, routeName, router]);

  const showTopButtons = !!session && !isLoading;

  const isHomeScreen = pathname === "/(app)/welcome";
  const showHomeButton = !isHomeScreen;

  const overlayTop = Math.max(insets.top, 12) + 8;

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />

      {showTopButtons ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: overlayTop,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            zIndex: 50,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* HOME (left) — hidden on /(app)/welcome */}
          {showHomeButton ? (
            <TouchableOpacity
              onPress={onHome}
              activeOpacity={0.85}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: "rgba(0,0,0,0.18)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                minWidth: 78,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "rgba(242,240,234,0.95)",
                  fontWeight: "900",
                  letterSpacing: 0.2,
                  fontSize: 13,
                }}
              >
                Home
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 78, height: 32 }} />
          )}

          {/* RIGHT SIDE: Delete Account + Logout */}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity
              onPress={onDeleteAccount}
              activeOpacity={0.85}
              disabled={loggingOut || deletingAccount}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: "rgba(220,38,38,0.22)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                minWidth: 120,
                alignItems: "center",
                opacity: loggingOut || deletingAccount ? 0.75 : 1,
              }}
            >
              <Text
                style={{
                  color: "rgba(242,240,234,0.95)",
                  fontWeight: "900",
                  letterSpacing: 0.2,
                  fontSize: 13,
                }}
              >
                {deletingAccount ? "Deleting…" : "Delete Account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLogout}
              activeOpacity={0.85}
              disabled={loggingOut || deletingAccount}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: "rgba(0,0,0,0.18)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                minWidth: 78,
                alignItems: "center",
                opacity: loggingOut || deletingAccount ? 0.75 : 1,
              }}
            >
              <Text
                style={{
                  color: "rgba(242,240,234,0.95)",
                  fontWeight: "900",
                  letterSpacing: 0.2,
                  fontSize: 13,
                }}
              >
                {loggingOut ? "Logging out…" : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

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
