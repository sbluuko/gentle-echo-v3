// app/(app)/profile.tsx — FULL REPLACEMENT
// ✅ Shows signed-in email
// ✅ Change password (Supabase updateUser)
// ✅ Delete account (calls an Edge Function stub: delete-user)
// ✅ Sign out -> gate to /(auth)

import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data?.user?.email ?? "");
    })();
  }, []);

  const signOut = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      router.replace("/(auth)");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert("Password too short", "Use at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        Alert.alert("Update failed", error.message);
        return;
      }
      setNewPassword("");
      Alert.alert("Password updated", "Your password has been changed.");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    Alert.alert(
      "Delete account",
      "This action is permanent. Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              // ✅ Secure deletion must happen server-side (admin privileges).
              // This expects an Edge Function named "delete-user" that deletes:
              // 1) auth user
              // 2) profiles row
              // 3) any storage objects if you want
              const { error } = await supabase.functions.invoke("delete-user", {
                body: {},
              });

              if (error) {
                Alert.alert(
                  "Delete failed",
                  "Account deletion requires a server function. If you want, I’ll provide the exact Edge Function code next.\n\n" +
                    error.message
                );
                return;
              }

              Alert.alert("Account deleted", "Your account has been deleted.");
              router.replace("/(auth)");
            } catch (e: any) {
              Alert.alert(
                "Delete failed",
                "Account deletion requires a server function. If you want, I’ll provide the exact Edge Function code next.\n\n" +
                  String(e?.message ?? e)
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Profile" }} />

      <ImageBackground
        source={require("../../assets/images/background_image.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.label}>Signed in as</Text>
            <Text style={styles.value}>{email || "—"}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Change Password</Text>

            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password (min 8 chars)"
              placeholderTextColor="rgba(242,240,234,0.55)"
              secureTextEntry
              style={styles.input}
              editable={!busy}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.btn, styles.btnPrimary, busy && styles.disabled]}
              onPress={changePassword}
              disabled={busy}
            >
              <Text style={styles.btnText}>Update Password</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.btn, styles.btnSecondary, busy && styles.disabled]}
            onPress={signOut}
            disabled={busy}
          >
            <Text style={styles.btnText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.btn, styles.btnDanger, busy && styles.disabled]}
            onPress={deleteAccount}
            disabled={busy}
          >
            <Text style={styles.btnText}>Delete Account</Text>
          </TouchableOpacity>

          <View style={{ height: 18 }} />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1020" },
  bg: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
    flexGrow: 1,
  },

  card: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 16,
    marginBottom: 14,
  },

  title: {
    color: "#F2F0EA",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  label: {
    color: "rgba(242,240,234,0.75)",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  value: {
    color: "#F2F0EA",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
  },

  section: {
    color: "#F2F0EA",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },

  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    color: "#F2F0EA",
    fontWeight: "800",
    marginBottom: 12,
  },

  btn: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginTop: 12,
  },

  btnPrimary: {
    backgroundColor: "rgba(99, 140, 255, 0.72)",
    borderColor: "rgba(255,255,255,0.18)",
    marginTop: 0,
  },

  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.18)",
    marginTop: 28,
  },

  btnDanger: {
    backgroundColor: "rgba(239,68,68,0.70)",
    borderColor: "rgba(255,255,255,0.18)",
    marginTop: 28,
  },

  btnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  disabled: { opacity: 0.7 },
});