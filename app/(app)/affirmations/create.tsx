// app/(app)/affirmations/create.tsx — FULL REPLACEMENT
// ✅ Step 1 ONLY: Choose an affirmation (TITLE ONLY)
// ✅ Tap an item -> routes to /affirmations/script with the FULL affirmation object
// ✅ Hard gate: must have voice_ready + voice_id, else -> /train
// ✅ Center title + subtitle
// ✅ Solid tile colors with MORE distinct variation per tile
// ✅ Removed "Tap to view script" from tiles

import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

type Affirmation = { id: string; title: string; text: string };

// ✅ ALL 9 affirmations — Core line removed from each script
const AFFIRMATIONS: Affirmation[] = [
  {
    id: "a1",
    title: "Mental Focus & Alignment",
    text:
      "My thinking remains clear and organized under varying conditions.\n\n" +
      "I direct my attention deliberately rather than reactively.\n\n" +
      "I notice distractions and return focus without effort or frustration.\n\n" +
      "My mind shifts between tasks smoothly and efficiently.\n\n" +
      "I retain useful information and release what is no longer relevant.\n\n" +
      "I adapt my thinking when conditions change without resistance.\n\n" +
      "My cognitive pace matches the demands of the situation.\n\n" +
      "I prioritize thoughts that support effective action.\n\n" +
      "I recognize when analysis is complete and move forward.\n\n" +
      "I hold complexity without becoming mentally overloaded.\n\n" +
      "My memory supports execution rather than distraction.\n\n" +
      "I think clearly even when information is incomplete.\n\n" +
      "I separate facts from interpretations with ease.\n\n" +
      "I maintain mental discipline without rigidity.\n\n" +
      "I allow my thinking to rest when it is no longer needed.\n\n" +
      "I process information accurately and efficiently.\n\n" +
      "I recognize mental fatigue and adjust accordingly.\n\n" +
      "I move between focused attention and broad awareness smoothly.\n\n" +
      "I update my understanding as new data becomes available.\n\n" +
      "My thoughts serve my goals rather than compete with them.\n\n" +
      "I maintain clarity without forcing control.\n\n" +
      "I recognize when to think deeply and when to simplify.\n\n" +
      "I trust my ability to reason under pressure.\n\n" +
      "I maintain cognitive flexibility without losing direction.\n\n" +
      "My mind operates as a reliable and adaptive tool.",
  },
  {
    id: "a2",
    title: "Emotional Regulation & Clarity",
    text:
      "My nervous system responds proportionately to what is happening now.\n\n" +
      "I experience emotions without being overwhelmed by them.\n\n" +
      "I return to baseline smoothly after stimulation.\n\n" +
      "My body recognizes safety in the present moment.\n\n" +
      "I remain emotionally steady in changing environments.\n\n" +
      "I regulate intensity rather than suppress emotion.\n\n" +
      "I allow sensations to pass without escalation.\n\n" +
      "My internal state remains stable even when external conditions shift.\n\n" +
      "I notice emotional signals without acting impulsively.\n\n" +
      "I create calm through regulation, not avoidance.\n\n" +
      "My breathing naturally supports nervous system balance.\n\n" +
      "I remain grounded during uncertainty.\n\n" +
      "I recover emotional equilibrium efficiently.\n\n" +
      "I recognize when I am safe and respond accordingly.\n\n" +
      "I maintain neutrality when emotional activation is unnecessary.\n\n" +
      "My nervous system trusts my ability to manage experience.\n\n" +
      "I disengage from stress responses when they are no longer needed.\n\n" +
      "I tolerate emotional activation without losing control.\n\n" +
      "I stabilize myself before engaging externally.\n\n" +
      "I allow calm to return without effort.\n\n" +
      "I maintain internal safety regardless of external input.\n\n" +
      "I regulate rather than react.\n\n" +
      "I remain present during emotional shifts.\n\n" +
      "I trust my capacity to self-soothe.\n\n" +
      "My emotional system functions reliably and predictably.",
  },
  {
    id: "a3",
    title: "Performance & Execution",
    text:
      "I begin tasks without unnecessary delay.\n\n" +
      "I maintain momentum once action is initiated.\n\n" +
      "I complete what I start.\n\n" +
      "My effort remains steady over time.\n\n" +
      "I execute tasks with appropriate precision.\n\n" +
      "I manage energy to sustain performance.\n\n" +
      "I move forward even when motivation fluctuates.\n\n" +
      "I focus on execution rather than over-planning.\n\n" +
      "I adjust pace without losing consistency.\n\n" +
      "I follow through regardless of emotional state.\n\n" +
      "I reduce friction in my workflow.\n\n" +
      "I maintain discipline without strain.\n\n" +
      "I recognize progress and continue.\n\n" +
      "I act decisively when requirements are clear.\n\n" +
      "I tolerate effort without resistance.\n\n" +
      "I maintain accuracy under pressure.\n\n" +
      "I sustain performance through completion.\n\n" +
      "I conserve energy by working efficiently.\n\n" +
      "I prioritize actions that move tasks forward.\n\n" +
      "I recover quickly between efforts.\n\n" +
      "I remain engaged until objectives are met.\n\n" +
      "I execute reliably even in low-stimulus states.\n\n" +
      "I simplify execution where possible.\n\n" +
      "I trust my ability to carry tasks through.\n\n" +
      "My actions align with intended outcomes.",
  },
  {
    id: "a4",
    title: "Inner Alignment",
    text:
      "I trust my internal guidance.\n\n" +
      "I make decisions based on my own standards.\n\n" +
      "I maintain clear personal boundaries.\n\n" +
      "I act consistently with my values.\n\n" +
      "I do not require external validation to function effectively.\n\n" +
      "I recognize my authority over my actions.\n\n" +
      "I define what is acceptable for me.\n\n" +
      "I remain aligned with my principles under pressure.\n\n" +
      "I respect my own limits.\n\n" +
      "I act with integrity even when unobserved.\n\n" +
      "I separate my identity from external opinions.\n\n" +
      "I trust my judgment.\n\n" +
      "I choose deliberately rather than by default.\n\n" +
      "I maintain autonomy in my decisions.\n\n" +
      "I operate from self-respect.\n\n" +
      "I enforce boundaries calmly.\n\n" +
      "I remain consistent across situations.\n\n" +
      "I act without self-betrayal.\n\n" +
      "I accept responsibility for my choices.\n\n" +
      "I do not abandon standards for approval.\n\n" +
      "I recognize my internal authority as sufficient.\n\n" +
      "I align actions with who I choose to be.\n\n" +
      "I maintain self-trust through action.\n\n" +
      "I operate independently while remaining cooperative.\n\n" +
      "My identity remains stable and self-defined.",
  },
  {
    id: "a5",
    title: "Stress Regulation",
    text:
      "I allow stress responses to complete and resolve.\n\n" +
      "I return to baseline after effort.\n\n" +
      "I release tension without force.\n\n" +
      "I disengage from demand when it ends.\n\n" +
      "My body recovers efficiently.\n\n" +
      "I permit rest without guilt.\n\n" +
      "I decompress naturally after exertion.\n\n" +
      "I separate work from recovery.\n\n" +
      "I recognize when stress is no longer useful.\n\n" +
      "I allow my nervous system to settle.\n\n" +
      "I restore balance through rest.\n\n" +
      "I detach from urgency when appropriate.\n\n" +
      "I down-shift without resistance.\n\n" +
      "I replenish energy intentionally.\n\n" +
      "I recover before depletion occurs.\n\n" +
      "I release accumulated strain.\n\n" +
      "I normalize rest as functional.\n\n" +
      "I regulate recovery as deliberately as effort.\n\n" +
      "I allow calm to return fully.\n\n" +
      "I reset between demands.\n\n" +
      "I respect recovery cycles.\n\n" +
      "I return to stability smoothly.\n\n" +
      "I disengage from stress loops.\n\n" +
      "I restore internal equilibrium.\n\n" +
      "My system resets efficiently.",
  },
  {
    id: "a6",
    title: "Personal Development",
    text:
      "I adjust strategies when conditions change.\n\n" +
      "I tolerate uncertainty without freezing.\n\n" +
      "I learn from outcomes without self-judgment.\n\n" +
      "I correct course as needed.\n\n" +
      "I persist through challenge.\n\n" +
      "I remain flexible while maintaining direction.\n\n" +
      "I respond to feedback constructively.\n\n" +
      "I update behavior based on results.\n\n" +
      "I adapt without abandoning goals.\n\n" +
      "I continue moving forward despite ambiguity.\n\n" +
      "I treat mistakes as data.\n\n" +
      "I refine approach through experience.\n\n" +
      "I remain open to improvement.\n\n" +
      "I integrate lessons efficiently.\n\n" +
      "I adjust without overreacting.\n\n" +
      "I maintain progress through iteration.\n\n" +
      "I adapt pace as required.\n\n" +
      "I improve through repetition.\n\n" +
      "I respond rather than resist change.\n\n" +
      "I remain stable while evolving.\n\n" +
      "I tolerate discomfort during growth.\n\n" +
      "I correct errors without delay.\n\n" +
      "I trust my capacity to adapt.\n\n" +
      "I maintain direction through uncertainty.\n\n" +
      "I grow through consistent adjustment.",
  },
  {
    id: "a7",
    title: "Social Connection",
    text:
      "I communicate clearly and directly.\n\n" +
      "I remain non-reactive in social exchanges.\n\n" +
      "I choose when to engage emotionally.\n\n" +
      "I maintain internal boundaries in conversation.\n\n" +
      "I assert needs calmly.\n\n" +
      "I separate others’ emotions from my own.\n\n" +
      "I regulate energy during interaction.\n\n" +
      "I listen without absorbing stress.\n\n" +
      "I respond intentionally rather than reflexively.\n\n" +
      "I engage selectively based on capacity.\n\n" +
      "I maintain composure under interpersonal pressure.\n\n" +
      "I calibrate trust appropriately.\n\n" +
      "I disengage when interaction is unproductive.\n\n" +
      "I remain grounded in social settings.\n\n" +
      "I speak with clarity and restraint.\n\n" +
      "I protect internal regulation during conflict.\n\n" +
      "I maintain autonomy in relationships.\n\n" +
      "I allow connection without overextension.\n\n" +
      "I manage social energy efficiently.\n\n" +
      "I remain centered regardless of others’ reactions.\n\n" +
      "I communicate boundaries without escalation.\n\n" +
      "I remain present without merging.\n\n" +
      "I engage from choice, not obligation.\n\n" +
      "I sustain clarity in group dynamics.\n\n" +
      "My social interactions remain regulated and intentional.",
  },
  {
    id: "a8",
    title: "Body Awareness",
    text:
      "I notice bodily signals accurately.\n\n" +
      "I regulate tension deliberately.\n\n" +
      "My body recognizes safety.\n\n" +
      "I adjust posture and movement as needed.\n\n" +
      "I allow muscles to relax when effort ends.\n\n" +
      "I manage physical energy efficiently.\n\n" +
      "I tolerate discomfort without panic.\n\n" +
      "I respond to pain signals appropriately.\n\n" +
      "I remain aware of physical limits.\n\n" +
      "I regulate breathing to support stability.\n\n" +
      "I maintain physical grounding.\n\n" +
      "I recognize fatigue early.\n\n" +
      "I restore bodily calm efficiently.\n\n" +
      "I move in ways that support regulation.\n\n" +
      "I maintain somatic awareness.\n\n" +
      "I respond to stress with relaxation cues.\n\n" +
      "I allow physical recovery.\n\n" +
      "I regulate activation levels.\n\n" +
      "I maintain bodily stability.\n\n" +
      "I trust my body’s feedback.\n\n" +
      "I maintain physical safety internally.\n\n" +
      "I reduce unnecessary tension.\n\n" +
      "I regulate effort and rest.\n\n" +
      "I support endurance through regulation.\n\n" +
      "My body functions as a stable system.",
  },
  {
    id: "a9",
    title: "Purpose & Direction",
    text:
      "I act with intention.\n\n" +
      "I align actions with priorities.\n\n" +
      "I choose direction deliberately.\n\n" +
      "I focus on what matters most.\n\n" +
      "I allocate energy toward long-term goals.\n\n" +
      "I act in service of defined objectives.\n\n" +
      "I avoid unnecessary distraction.\n\n" +
      "I orient actions toward future outcomes.\n\n" +
      "I maintain clarity of purpose.\n\n" +
      "I make decisions based on alignment.\n\n" +
      "I prioritize consistently.\n\n" +
      "I act with awareness of consequence.\n\n" +
      "I choose meaning through action.\n\n" +
      "I maintain direction over time.\n\n" +
      "I organize effort around values.\n\n" +
      "I orient behavior toward progress.\n\n" +
      "I avoid reactive living.\n\n" +
      "I direct attention intentionally.\n\n" +
      "I align short-term actions with long-term aims.\n\n" +
      "I commit to chosen paths.\n\n" +
      "I act with future awareness.\n\n" +
      "I simplify decisions through priorities.\n\n" +
      "I maintain coherence between goals and actions.\n\n" +
      "I choose deliberately rather than impulsively.\n\n" +
      "My actions reflect intentional direction.",
  },
];

// ✅ More distinct solid colors (still fits your dusk palette)
const TILE_COLORS = [
  "#3B5B7A", // brighter
  "#2E6A78", // teal shift
  "#5A4A84", // violet shift
  "#1F5F8B", // blue pop
  "#4B6B3D", // green shift
  "#7A4E3B", // warm earth
  "#2F4A73", // deep blue
  "#5C3E6F", // plum
  "#1F3E54", // dark anchor
];

export default function CreateAffirmation() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  // HARD GATE: must have voice_id
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

  const subtitle = useMemo(() => "Select an affirmation from the menu below. Tap the title to view the full script.", []);

  const openScript = async (a: Affirmation) => {
    if (busyId) return;
    try {
      setBusyId(a.id);
      const payload = encodeURIComponent(JSON.stringify(a));
      router.push(`/(app)/affirmations/script?affirmation=${payload}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: lift }] }]}>
          <Text style={styles.header}>Choose Affirmation</Text>
          <Text style={styles.sub}>{subtitle}</Text>

          {checking ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={styles.list}>
              {AFFIRMATIONS.map((a, idx) => {
                const isBusy = busyId === a.id;
                const bg = TILE_COLORS[idx % TILE_COLORS.length];

                return (
                  <TouchableOpacity
                    key={a.id}
                    activeOpacity={0.9}
                    onPress={() => openScript(a)}
                    disabled={!!busyId}
                    style={[styles.item, { backgroundColor: bg }, !!busyId && styles.disabled]}
                  >
                    <Text style={styles.itemTitle}>{a.title}</Text>

                    {/* ✅ Removed "Tap to view script" */}
                    {isBusy ? <Text style={styles.itemOpening}>Opening…</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  dusk: "#26384C",
  text: "#F2F0EA",
  textDim: "rgba(242,240,234,0.70)",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dusk },
  scroll: { padding: 16, paddingBottom: 40 },
  inner: { paddingTop: 70 },

  header: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  sub: {
    marginTop: 8,
    color: COLORS.textDim,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
  },

  loadingBox: { paddingVertical: 30, alignItems: "center", justifyContent: "center" },

  list: { marginTop: 14, gap: 12 },

  item: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  itemTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",
    width: "100%",
  },

  itemOpening: {
    marginTop: 8,
    color: "rgba(255,255,255,0.85)",
    fontSize: 12.5,
    fontWeight: "800",
    textAlign: "center",
  },

  disabled: { opacity: 0.7 },
});
