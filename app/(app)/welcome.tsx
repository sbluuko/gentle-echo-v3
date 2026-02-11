// app/(app)/welcome.tsx — FULL REPLACEMENT (HOME SCREEN)
// ✅ HARD GATE: user must never see Home until voice_ready + voice_id exist
// ✅ Adds "BREATHING SYNC" as a third app tile
// ✅ Raise logo ~1/4 inch
// ✅ Move title + subtitle up ~1/4 inch
// ✅ Raise all application tiles up ~1/4 inch
// ✅ Change Breathing Sync tile color to be different from the other two
// ✅ Keeps your exact existing layout + styling patterns

import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const QUARTER_INCH_PX = 18; // ~0.25 inch @ typical mobile scale

export default function Welcome() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Fade-in
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  // HARD GATE: user must never see Home until voice profile exists
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goReflect = () => router.push("/(app)/main");
  const goAffirmations = () => router.push("/(app)/affirmations");
  const goBreathingSync = () => router.push("/(app)/breathing-sync");

  const headerTitle = useMemo(() => "Gentle Echo Applications", []);
  const headerSub = useMemo(() => "Select from one of the applications below.", []);

  const disabled = checking;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
    >
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}>
          {checking ? (
            <View style={styles.checkingBox}>
              <ActivityIndicator color={COLORS.text} />
              <Text style={styles.checkingText}>Loading…</Text>
            </View>
          ) : null}

          {/* Logo — raised ~1/4 inch */}
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/images/Gentle Echo logo v2.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={{ height: 4 - QUARTER_INCH_PX }} />

          {/* Title + subtitle — moved up ~1/4 inch */}
          <Text style={styles.pageTitle}>{headerTitle}</Text>
          <Text style={styles.pageSub}>{headerSub}</Text>

          {/* Space before tiles — reduced to lift tiles up ~1/4 inch */}
          <View style={{ height: 35 - QUARTER_INCH_PX }} />

          {/* REFLECT */}
          <AppCard
            title="REFLECTIONS"
            description="Record your thoughts and hear it played back to you with calm and clarity"
            color={COLORS.reflectCard}
            disabled={disabled}
            onPress={goReflect}
          />

          <View style={{ height: 18 }} />

          {/* AFFIRMATIONS */}
          <AppCard
            title="AFFIRMATIONS"
            description="Create your own 10 minute affirmation with background music"
            color={COLORS.affirmCard}
            disabled={disabled}
            onPress={goAffirmations}
          />

          <View style={{ height: 18 }} />

          {/* BREATHING SYNC — distinct color */}
          <AppCard
            title="BREATHING SYNC"
            description="Guide your breathing with a calming visual rhythm to help you downshift in real time"
            color={COLORS.breathCard}
            disabled={disabled}
            onPress={goBreathingSync}
          />

          <View style={{ height: 28 }} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  bg: "#1F2543",
  text: "#F2F0EA",
  textDim: "rgba(242,240,234,0.74)",

  reflectCard: "rgba(19,167,154,0.22)",
  affirmCard: "rgba(123,102,255,0.20)",

  // ✅ Make Breathing Sync clearly different than the other two (warm amber glow)
  breathCard: "rgba(245, 158, 11, 0.18)",

  border: "rgba(255,255,255,0.14)",
  btnBg: "rgba(255,255,255,0.16)",
  btnBorder: "rgba(255,255,255,0.18)",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },

  // Raise overall content slightly so tiles come up too
  inner: { paddingTop: Math.max(0, 10 - QUARTER_INCH_PX) },

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

  // Logo raised ~1/4 inch by reducing marginTop
  logoWrap: {
    marginTop: 16 - QUARTER_INCH_PX,
    marginBottom: 2,
    alignItems: "center",
  },

  logo: { width: 360, height: 240 },

  pageTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginTop: -QUARTER_INCH_PX, // pull title up ~1/4 inch
  },
  pageSub: {
    color: COLORS.textDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
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
