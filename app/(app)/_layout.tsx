import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useProfile } from "../../lib/useProfile";
import { useSession } from "../../lib/useSession";

function isTrainingComplete(profile: {
  voice_id: string | null;
  voice_ready: boolean | null;
} | null) {
  if (!profile) return false;
  if (profile.voice_ready === true) return true;
  if (profile.voice_id && profile.voice_id.length > 0) return true;
  return false;
}

export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();

  // ✅ EXPLICIT TYPE NARROWING — THIS IS THE FIX
  const rootSegment: string | null =
    Array.isArray(segments) && typeof segments[0] === "string"
      ? segments[0]
      : null;

  const { session, isLoading: sessionLoading } = useSession();
  const { profile, isLoading: profileLoading } = useProfile();

  const isLoading = sessionLoading || profileLoading;

  useEffect(() => {
    if (isLoading) return;

    // If not logged in, always go to auth (auth index is "/")
    if (!session) {
      router.replace("/" as any);
      return;
    }

    // If training not complete, force /train
    if (!isTrainingComplete(profile)) {
      router.replace("/train" as any);
      return;
    }

    // If training complete, keep user out of /train and send to /main
    if (rootSegment === "train") {
      router.replace("/main" as any);
      return;
    }
  }, [isLoading, session, profile, rootSegment, router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
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
