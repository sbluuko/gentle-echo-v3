// app/(app)/index.tsx — FULL REPLACEMENT (App Gate)
// ✅ After ANY login: ALWAYS route to /(app)/welcome (100% of the time)
// ✅ Not logged in -> /(auth)
// ✅ Removed "Don't show again" logic entirely

import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

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

        // ✅ ALWAYS land on welcome after login
        if (!cancelled) router.replace("/(app)/welcome");
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
