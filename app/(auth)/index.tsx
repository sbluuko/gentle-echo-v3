// app/(auth)/index.tsx — FULL REPLACEMENT
// ✅ Updated to newer Gentle Echo visual style
// ✅ Background image + dark overlay
// ✅ Keeps Sign In + Create Mode
// ✅ Keeps signup success popup -> /(app)/train
// ✅ Keeps forgot password
// ✅ Keeps already-logged-in redirect
// ✅ Keeps password mismatch handling

import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function AuthIndex() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert("Login failed", error.message);
        return;
      }

      router.replace("/(app)");
    } catch (e: any) {
      Alert.alert("Login failed", String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountPress = async () => {
    if (!createMode) {
      setCreateMode(true);
      resetPasswords();
      setShowPassword(false);
      return;
    }

    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing info", "Enter email and both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords Do Not Match", "", [
        {
          text: "OK",
          onPress: () => {
            resetPasswords();
          },
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        Alert.alert("Sign up failed", error.message);
        return;
      }

      if (data?.session) {
        setShowSignupSuccess(true);
        return;
      }

      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (!loginErr) {
        setShowSignupSuccess(true);
        return;
      }

      Alert.alert(
        "Account created",
        "Your account was created, but you must confirm your email before continuing. Please check your inbox, then return and sign in."
      );
    } catch (e: any) {
      Alert.alert("Sign up failed", String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ImageBackground
        source={require("../../assets/images/background_image.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.bgDarken} />

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 32 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}
              >
                <Text style={styles.kicker}>Welcome to</Text>
                <Text style={styles.title}>Gentle Echo</Text>
                <Text style={styles.tagline}>A Quiet Space for Calm Reflections</Text>

                <View style={styles.formCard}>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Email"
                      placeholderTextColor="rgba(219,234,254,0.88)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                      editable={!loading}
                      underlineColorAndroid="transparent"
                      textAlignVertical="center"
                    />
                  </View>

                  <View style={styles.inputWrapRow}>
                    <TextInput
                      style={styles.inputFieldRow}
                      placeholder="Password"
                      placeholderTextColor="rgba(219,234,254,0.88)"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
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

                  {createMode ? (
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.inputField}
                        placeholder="Confirm Password"
                        placeholderTextColor="rgba(219,234,254,0.88)"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!loading}
                        underlineColorAndroid="transparent"
                        textAlignVertical="center"
                      />
                    </View>
                  ) : null}

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

                  <View style={styles.bigGap} />

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleCreateAccountPress}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {createMode
                        ? loading
                          ? "Please wait…"
                          : "Create My Account"
                        : "Select to Create a New Account"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Modal visible={showSignupSuccess} transparent animationType="fade" onRequestClose={() => {}}>
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                      <Text style={styles.modalTitle}>Account created</Text>

                      <Text style={styles.modalBody}>
                        You have successfully created your Gentle Echo account. You will now be taken to our Voice
                        Training page so we can learn and recreate your voice for all your future personalized play
                        back recordings.
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.modalButton}
                        onPress={() => {
                          setShowSignupSuccess(false);
                          router.replace("/(app)/train");
                        }}
                      >
                        <Text style={styles.modalButtonText}>Continue</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#26384C",
  },

  bg: {
    flex: 1,
  },

  bgDarken: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 28, 40, 0.58)",
  },

  container: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 36,
    justifyContent: "flex-start",
  },

  inner: {
    flex: 1,
  },

  kicker: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(242,240,234,0.88)",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.6,
  },

  tagline: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(242,240,234,0.82)",
    textAlign: "center",
    marginBottom: 34,
    letterSpacing: 0.2,
    lineHeight: 21,
  },

  formCard: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 16,
  },

  inputWrap: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    justifyContent: "center",
    marginBottom: 14,
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
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    marginBottom: 14,
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
    height: 54,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  showHideText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(37,99,235,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  forgotWrapTight: {
    marginTop: 12,
    alignItems: "center",
  },

  forgotText: {
    color: "rgba(242,240,234,0.92)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    textDecorationLine: "underline",
  },

  bigGap: {
    height: 46,
  },

  secondaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
    paddingHorizontal: 10,
  },

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