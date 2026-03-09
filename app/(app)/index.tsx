// app/(app)/index.tsx — FULL REPLACEMENT
// ✅ Not logged in -> /(auth)
// ✅ Not trained -> /(app)/train
// ✅ Trained -> /(app)/home
// ✅ Uses replace() intentionally for gate flow

import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

const TRAIN_ROUTE = "/(app)/train";
const HOME_ROUTE = "/(app)/home";

export default function AppIndex() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const go = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data?.session?.user) {
          if (!cancelled) router.replace("/(auth)");
          return;
        }

        const userId = data.session.user.id;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("voice_ready, voice_id")
          .eq("id", userId)
          .single();

        if (profileError || !profile?.voice_ready || !profile?.voice_id) {
          if (!cancelled) router.replace(TRAIN_ROUTE);
          return;
        }

        if (!cancelled) router.replace(HOME_ROUTE);
      } catch {
        if (!cancelled) router.replace("/(auth)");
      }
    };

    go();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator />
      <Text style={styles.text}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginTop: 10,
    opacity: 0.7,
  },
});