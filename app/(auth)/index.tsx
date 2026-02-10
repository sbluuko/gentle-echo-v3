import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Mode = "login" | "signup";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password) return false;
    if (mode === "signup") {
      if (!confirm) return false;
      if (password !== confirm) return false;
      if (password.length < 8) return false;
    }
    return true;
  }, [email, password, confirm, mode]);

  async function onSubmit() {
    if (!canSubmit) return;

    const e = email.trim().toLowerCase();

    if (mode === "signup" && password !== confirm) {
      Alert.alert("Passwords do not match", "Please re-enter your password.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: e,
          password,
        });
        if (error) throw error;

        Alert.alert(
          "Account created",
          "If email confirmation is required, check your inbox. Otherwise you can log in now."
        );

        setMode("login");
        setPassword("");
        setConfirm("");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: e,
        password,
      });
      if (error) throw error;
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome to</Text>
          <Text style={styles.title}>Gentle Echo</Text>
        </View>

        {/* Spacer */}
        <View style={styles.headerSpacer} />

        {/* Login / Signup switch */}
        <View style={styles.switchRow}>
          <Pressable
            style={[styles.switchBtn, mode === "login" && styles.switchBtnActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.switchText, mode === "login" && styles.switchTextActive]}>
              Log In
            </Text>
          </Pressable>

          <Pressable
            style={[styles.switchBtn, mode === "signup" && styles.switchBtnActive]}
            onPress={() => setMode("signup")}
          >
            <Text style={[styles.switchText, mode === "signup" && styles.switchTextActive]}>
              Sign Up
            </Text>
          </Pressable>
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />

        {/* Password */}
        <Text style={[styles.label, styles.mt12]}>Password</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, styles.inputFlex]}
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
            <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        {/* Confirm password */}
        {mode === "signup" && (
          <>
            <Text style={[styles.label, styles.mt12]}>Confirm password</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter password"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, styles.inputFlex]}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                <Text style={styles.eyeText}>{showConfirm ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>

            {password.length > 0 && password.length < 8 && (
              <Text style={styles.hint}>Password must be at least 8 characters.</Text>
            )}

            {confirm.length > 0 && password !== confirm && (
              <Text style={styles.hint}>Passwords must match.</Text>
            )}
          </>
        )}

        {/* Submit */}
        <Pressable
          style={[styles.primaryBtn, (!canSubmit || loading) && styles.primaryBtnDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryText}>
              {mode === "signup" ? "Create account" : "Log in"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 20,
  },

  /* Header */
  header: {
    alignItems: "center",
  },
  welcome: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
    textAlign: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: {
    height: 28,
  },

  /* Switch */
  switchRow: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  switchBtnActive: {
    backgroundColor: "#111",
  },
  switchText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  switchTextActive: {
    color: "#fff",
  },

  /* Inputs */
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    marginBottom: 6,
  },
  mt12: {
    marginTop: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputFlex: {
    flex: 1,
  },
  eyeBtn: {
    marginLeft: 8,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  hint: {
    color: "#B00020",
    fontSize: 12,
    marginTop: 6,
  },

  /* Button */
  primaryBtn: {
    marginTop: 20,
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
