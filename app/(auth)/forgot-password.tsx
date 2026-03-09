import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Fade-in animation
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, lift]);

  const handleSendReset = async () => {
    if (!email) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert("Reset failed", error.message);
      return;
    }

    Alert.alert(
      "Check your email",
      "If an account exists for that email, you’ll receive a password reset link.",
      [
        {
          text: "Back to sign in",
          onPress: () => router.push("/(auth)"),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View
          style={[
            styles.inner,
            {
              opacity: fade,
              transform: [{ translateY: lift }],
            },
          ]}
        >
          <Text style={styles.kicker}>Reset your password</Text>
          <Text style={styles.title}>Inner Wisdom</Text>
          <Text style={styles.subtitle}>
            Enter your email and we’ll send you a reset link.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#dbeafe"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSendReset}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Sending…" : "Send Reset Link"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2563eb",
  },

  inner: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 110,
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

  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 42,
    letterSpacing: 0.4,
    lineHeight: 20,
  },

  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 16,
    borderWidth: 0,
    letterSpacing: 0.2,
  },

  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  backBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 6,
  },

  backText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
    textDecorationLine: "underline",
  },
});
