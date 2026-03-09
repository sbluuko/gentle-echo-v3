// components/AppButton.tsx — NEW FILE
// ✅ Consistent buttons across the entire app

import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: ViewStyle;
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled,
  style,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!!disabled}
      style={[
        styles.btn,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  primary: {
    backgroundColor: "rgba(99, 140, 255, 0.72)",
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  danger: {
    backgroundColor: "rgba(239,68,68,0.70)",
  },
  text: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  disabled: { opacity: 0.65 },
});