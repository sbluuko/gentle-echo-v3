import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../lib/useSession";

export default function RootLayout() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (!session && inAppGroup) {
      router.replace("/(auth)");
      return;
    }

    if (session && inAuthGroup) {
      router.replace("/(app)");
      return;
    }

    // If you're at root with no group yet, force it
    if (!session && !inAuthGroup) {
      router.replace("/(auth)");
      return;
    }

    if (session && !inAppGroup) {
      router.replace("/(app)");
      return;
    }
  }, [isLoading, session, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
