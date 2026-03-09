// app/(app)/index.tsx — FULL REPLACEMENT (App Gate)
// ✅ Not logged in -> /(auth)
// ✅ Not trained (voice_ready + voice_id missing) -> /(app)/train
// ✅ Trained -> /(app)/home
// ✅ Uses replace() intentionally (gate screens should not be "back navigable")

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
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;

        if (!user) {
          if (!cancelled) router.replace("/(auth)");
          return;
        }

        // Check voice status
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("voice_ready, voice_id")
          .eq("id", user.id)
          .single();

        // If profile can't be read, safest default is training gate
        if (error || !profile?.voice_ready || !profile?.voice_id) {
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
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { marginTop: 10, opacity: 0.7 },
});