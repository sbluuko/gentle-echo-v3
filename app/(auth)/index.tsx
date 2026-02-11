// app/(auth)/index.tsx — FULL REPLACEMENT
// ✅ Sign In + Create Mode (confirm password)
// ✅ Signup success popup -> Continue -> /(app)/train (bypasses welcome)
// ✅ "Forgot password?" under Sign In
// ✅ Button text changed: "Select to Create a New Account"
// ✅ Password mismatch popup clears both password fields
// ✅ Removes input bottom line using wrapper views

import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function AuthIndex() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ NEW: create mode toggle
  const [createMode, setCreateMode] = useState(false);

  // ✅ NEW: signup success popup
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  // Fade-in animation on mount
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  // ✅ Optional: if user is already logged in and not in create flow, send them into the app
  // (But do NOT do this when signup modal is showing)
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data?.session && !createMode && !showSignupSuccess) {
          router.replace("/(app)");
        }
      } catch {}
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [createMode, showSignupSuccess]);

  const resetPasswords = () => {
    setPassword("");
    setConfirmPassword("");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter email and password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Login failed", error.message);
      return;
    }

    router.replace("/(app)");
  };

  const handleCreateAccountPress = async () => {
    // First press: enter create mode (hide Sign In, show Confirm Password)
    if (!createMode) {
      setCreateMode(true);
      resetPasswords();
      setShowPassword(false);
      return;
    }

    // Create mode: submit signup
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing info", "Enter email and both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords Do Not Match", "", [
        {
          text: "OK",
          onPress: () => {
            // ✅ both password entries disappear (cleared) and must be re-entered
            resetPasswords();
          },
        },
      ]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Sign up failed", error.message);
      return;
    }

    // If session exists immediately, show popup (do NOT route yet)
    if (data?.session) {
      setShowSignupSuccess(true);
      return;
    }

    // If session is null, try immediate sign-in (works if confirm-email is OFF)
    setLoading(true);
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (!loginErr) {
      setShowSignupSuccess(true);
      return;
    }

    Alert.alert(
      "Account created",
      "Your account was created, but you must confirm your email before continuing. Please check your inbox, then return and sign in."
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}>
          <Text style={styles.kicker}>Welcome to</Text>
          <Text style={styles.title}>Gentle Echo</Text>
          <Text style={styles.tagline}>A Quiet Space for Calm Reflections</Text>

          {/* ✅ Email wrapped to eliminate bottom line */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputField}
              placeholder="Email"
              placeholderTextColor="#dbeafe"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              underlineColorAndroid="transparent"
              textAlignVertical="center"
            />
          </View>

          {/* ✅ Password row wrapped to eliminate bottom line */}
          <View style={styles.inputWrapRow}>
            <TextInput
              style={styles.inputFieldRow}
              placeholder="Password"
              placeholderTextColor="#dbeafe"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              underlineColorAndroid="transparent"
              textAlignVertical="center"
            />

            <TouchableOpacity
              style={styles.showHideBtn}
              onPress={() => setShowPassword((v) => !v)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.showHideText}>{showPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Confirm password only in create mode */}
          {createMode ? (
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.inputField}
                placeholder="Confirm Password"
                placeholderTextColor="#dbeafe"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                underlineColorAndroid="transparent"
                textAlignVertical="center"
              />
            </View>
          ) : null}

          {/* ✅ Sign In hidden when creating account */}
          {!createMode ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>{loading ? "Please wait…" : "Sign In"}</Text>
              </TouchableOpacity>

              {/* ✅ Forgot password moved to directly below Sign In */}
              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
                disabled={loading}
                activeOpacity={0.8}
                style={styles.forgotWrapTight}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* ✅ Larger gap between Sign In area and Create button area */}
          <View style={styles.bigGap} />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCreateAccountPress}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>
              {createMode ? (loading ? "Please wait…" : "Create My Account") : "Select to Create a New Account"}
            </Text>
          </TouchableOpacity>

          {/* ✅ SIGNUP SUCCESS POPUP (Continue -> /(app)/train) */}
          <Modal visible={showSignupSuccess} transparent animationType="fade" onRequestClose={() => {}}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Account created</Text>

                <Text style={styles.modalBody}>
                  You have successfully created your Gentle Echo account. You will now be taken to our Voice Training page
                  so we can learn and recreate your voice for all your future personalized play back recordings.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.modalButton}
                  onPress={() => {
                    setShowSignupSuccess(false);
                    // ✅ bypass welcome, go straight to voice training
                    router.replace("/(app)/train");
                  }}
                >
                  <Text style={styles.modalButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </Animated.View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2563eb" },

  inner: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 90,
    paddingHorizontal: 24,
  },

  kicker: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.6,
  },

  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: 0.8,
  },

  tagline: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 42,
    letterSpacing: 0.4,
    lineHeight: 20,
  },

  // ✅ Wrapper inputs (removes bottom line artifacts)
  inputWrap: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 16,
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 0,
  },
  inputField: {
    fontSize: 16,
    color: "#ffffff",
    paddingVertical: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },

  inputWrapRow: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    marginBottom: 16,
    borderWidth: 0,
  },
  inputFieldRow: {
    flex: 1,
    fontSize: 16,
    color: "#ffffff",
    paddingVertical: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingRight: 10,
  },

  showHideBtn: {
    height: 52,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  showHideText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },

  // ✅ tighter spacing for forgot under sign-in
  forgotWrapTight: { marginTop: 10, alignItems: "center" },

  forgotText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.25,
    textDecorationLine: "underline",
  },

  // ✅ gap between sections (sign-in area and create-area)
  bigGap: { height: 56 },

  secondaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    opacity: 0.97,
    letterSpacing: 0.25,
    textAlign: "center",
    paddingHorizontal: 10,
  },

  // ✅ modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.50)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#26384C",
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  modalBody: {
    color: "#D6DEE8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 18,
  },
  modalButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#26384C",
    fontSize: 16,
    fontWeight: "900",
  },
});
