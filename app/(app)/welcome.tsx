// app/(app)/welcome.tsx — FULL REPLACEMENT (REFLECTIONS ONLY)

import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function Welcome() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setChecking(true);

        const { data: authData, error: authErr } = await supabase.auth.getUser();
        const userId = authData?.user?.id;

        if (authErr || !userId) {
          Alert.alert("Not logged in", "Please sign in again.");
          router.replace("/(auth)");
          return;
        }

        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("voice_ready, voice_id")
          .eq("id", userId)
          .single();

        if (profErr) {
          Alert.alert("Profile error", "Could not load your profile. Please try again.");
          return;
        }

        if (!profile?.voice_ready || !profile?.voice_id) {
          router.replace("/(app)/train");
          return;
        }
      } catch (e: any) {
        Alert.alert("Error", String(e?.message ?? e));
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const goReflect = () => router.push("/(app)/main");
  const disabled = checking;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ImageBackground
        source={require("../../assets/images/background_image.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.inner,
              {
                opacity: fade,
                transform: [{ translateY: lift }],
              },
            ]}
          >
            {checking ? (
              <View style={styles.checkingBox}>
                <ActivityIndicator color={COLORS.text} />
                <Text style={styles.checkingText}>Loading…</Text>
              </View>
            ) : null}

            <Text style={styles.pageTitle}>Gentle Echo</Text>
            <Text style={styles.pageSub}>
              Record your reflections and hear them calmly played back to support
              clarity, relaxation, and sleep
            </Text>

            <View style={{ height: 24 }} />

            <AppCard
              title="VOICE ECHO"
              description="Record your thoughts and hear them calmly played back to you with clarity"
              color={COLORS.reflectCard}
              disabled={disabled}
              onPress={goReflect}
            />

            <View style={{ height: 26 }} />
          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function AppCard(props: {
  title: string;
  description: string;
  color: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { title, description, color, disabled, onPress } = props;

  return (
    <View style={[styles.card, { backgroundColor: color, opacity: disabled ? 0.7 : 1 }]}>
      <Text style={styles.cardTitle}>{title}</Text>

      <View style={styles.cardRow}>
        <Text style={styles.cardDesc}>{description}</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={disabled}
          onPress={onPress}
          style={styles.selectBtn}
        >
          <Text style={styles.selectText}>SELECT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const COLORS = {
  text: "#F2F0EA",
  textDim: "rgba(242,240,234,0.74)",
  reflectCard: "rgba(19,167,154,0.50)",
  border: "rgba(255,255,255,0.14)",
  btnBg: "rgba(255,255,255,0.20)",
  btnBorder: "rgba(255,255,255,0.18)",
};

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
    justifyContent: "center",
  },

  inner: {
    width: "100%",
    alignSelf: "center",
  },

  checkingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },

  checkingText: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: "700",
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
  },

  pageSub: {
    color: COLORS.textDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 8,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 12,
    textAlign: "center",
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardDesc: {
    flex: 0.6,
    color: "rgba(242,240,234,0.84)",
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
  },

  selectBtn: {
    flex: 0.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.btnBg,
    borderWidth: 1,
    borderColor: COLORS.btnBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  selectText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});