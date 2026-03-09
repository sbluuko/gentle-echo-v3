// app/(app)/breathing-sync/session.tsx — FULL REPLACEMENT
// ✅ Keeps STACK header back button (default iOS/Android back)
// ✅ Removes ONLY the custom in-screen Back button (the one you had in the header row)
// ✅ Matches Welcome look: background_image.png + dark overlays + glass tiles
// ✅ Safe-area aware spacing (top + bottom) so iPhone/Android behave the same

import { Audio } from "expo-av";
import { Stack, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

type PatternId = "box" | "478" | "calm" | "reset";
type PhaseKey = "inhale" | "hold1" | "exhale" | "hold2";
type BgMode = "music" | "noise" | "none";

type Pattern = {
  id: PatternId;
  name: string;
  subtitle: string; // multiline with \n
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
};

const PATTERNS: Record<PatternId, Pattern> = {
  box: {
    id: "box",
    name: "Box Breathing",
    subtitle: "4 Second Inhale    4 Second Hold\n4 Second Exhale    4 Second Hold",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  },
  "478": {
    id: "478",
    name: "4–7–8 Breathing",
    subtitle: "4 Second Inhale    7 Second Hold\n8 Second Exhale    0 Second Hold",
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
  },
  calm: {
    id: "calm",
    name: "Calm Flow",
    subtitle: "5 Second Inhale    0 Second Hold\n5 Second Exhale    0 Second Hold",
    inhale: 5,
    hold1: 0,
    exhale: 5,
    hold2: 0,
  },
  reset: {
    id: "reset",
    name: "Reset Breath",
    subtitle: "6 Second Inhale    2 Second Hold\n6 Second Exhale    0 Second Hold",
    inhale: 6,
    hold1: 2,
    exhale: 6,
    hold2: 0,
  },
};

const PHASE_LABELS: Record<PhaseKey, string> = {
  inhale: "INHALE",
  hold1: "HOLD",
  exhale: "EXHALE",
  hold2: "HOLD",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function BreathingSyncSession() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const patternId = (params?.pattern as PatternId) || "box";
  const pattern = PATTERNS[patternId] ?? PATTERNS.box;

  // Background audio
  const bgRef = useRef<Audio.Sound | null>(null);
  const [bgReady, setBgReady] = useState(false);
  const [bgMode, setBgMode] = useState<BgMode>("music");

  // Voice guidance
  const [voiceOn, setVoiceOn] = useState(true);

  // Session state
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);

  const [phase, setPhase] = useState<PhaseKey>("inhale");
  const [count, setCount] = useState<number>(pattern.inhale);

  // Prep countdown
  const [prepping, setPrepping] = useState(false);
  const [prepCount, setPrepCount] = useState(3);

  // Keep “live” flags for timers
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const preppingRef = useRef(false);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    preppingRef.current = prepping;
  }, [prepping]);

  // Animations
  const scale = useRef(new Animated.Value(0.88)).current;
  const glow = useRef(new Animated.Value(0)).current;

  // Progress ring (0..1)
  const ringProgress = useRef(new Animated.Value(0)).current;
  const ringAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Timers
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<PhaseKey>("inhale");
  const countRef = useRef<number>(pattern.inhale);

  const phaseOrder = useMemo(() => {
    const seq: { key: PhaseKey; seconds: number }[] = [
      { key: "inhale", seconds: pattern.inhale },
      { key: "hold1", seconds: pattern.hold1 },
      { key: "exhale", seconds: pattern.exhale },
      { key: "hold2", seconds: pattern.hold2 },
    ];
    return seq.filter((s) => s.seconds > 0);
  }, [pattern]);

  const getPhaseSeconds = (k: PhaseKey) => {
    const found = phaseOrder.find((p) => p.key === k);
    return found?.seconds ?? 0;
  };

  const stopAllTimers = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    if (prepRef.current) clearInterval(prepRef.current);
    prepRef.current = null;
  };

  const stopRingAnim = () => {
    try {
      ringAnimRef.current?.stop?.();
    } catch {}
    ringAnimRef.current = null;
  };

  const startRingForSeconds = (seconds: number) => {
    if (pausedRef.current || preppingRef.current) return;

    stopRingAnim();
    ringProgress.setValue(0);

    const ms = Math.max(1, seconds) * 1000;

    const anim = Animated.timing(ringProgress, {
      toValue: 1,
      duration: ms,
      useNativeDriver: false,
    });

    ringAnimRef.current = anim;
    anim.start(() => {});
  };

  const speak = (text: string, interrupt: boolean = true) => {
    if (!voiceOn) return;
    try {
      if (interrupt) Speech.stop();
      Speech.speak(text, {
        language: "en-GB",
        rate: 0.92,
        pitch: 1.0,
        volume: 0.7,
      });
    } catch {}
  };

  const phaseSpeak = (k: PhaseKey) => {
    if (k === "inhale") speak("Inhale");
    else if (k === "exhale") speak("Exhale");
    else speak("Hold");
  };

  const animateForPhase = (k: PhaseKey) => {
    const to =
      k === "inhale"
        ? 1.06
        : k === "exhale"
        ? 0.88
        : (scale as any).__getValue?.() ?? 0.96;

    Animated.timing(scale, { toValue: to, duration: 650, useNativeDriver: true }).start();
    Animated.timing(glow, {
      toValue: k === "inhale" ? 1 : k === "exhale" ? 0.2 : 0.6,
      duration: 650,
      useNativeDriver: false,
    }).start();
  };

  const setPhaseAndCount = (k: PhaseKey, seconds: number) => {
    phaseRef.current = k;
    countRef.current = seconds;

    setPhase(k);
    setCount(seconds);

    animateForPhase(k);

    // ✅ restart ring every phase
    if (runningRef.current && !pausedRef.current && !preppingRef.current) {
      startRingForSeconds(seconds);
    }

    phaseSpeak(k);
  };

  const nextPhase = () => {
    const idx = phaseOrder.findIndex((p) => p.key === phaseRef.current);
    const next = phaseOrder[(idx + 1) % phaseOrder.length];
    setPhaseAndCount(next.key, next.seconds);
  };

  const startBreathTimer = () => {
    if (tickRef.current) clearInterval(tickRef.current);

    startRingForSeconds(Math.max(1, countRef.current));

    tickRef.current = setInterval(() => {
      const next = countRef.current - 1;

      if (next <= 0) {
        nextPhase();
        return;
      }

      countRef.current = next;
      setCount(next);

      // optional voice countdown: last 3 seconds
      if (voiceOn && !preppingRef.current && next <= 3 && next >= 1) {
        speak(String(next), false);
      }
    }, 1000);
  };

  const stopBg = async () => {
    try {
      if (bgRef.current) {
        await bgRef.current.stopAsync().catch(() => {});
        await bgRef.current.unloadAsync().catch(() => {});
      }
    } catch {}
    bgRef.current = null;
  };

  const applyBgMode = async (mode: BgMode, shouldPlay: boolean) => {
    try {
      await stopBg();
      if (mode === "none") return;

      const s = new Audio.Sound();
      await s.loadAsync(
        // @ts-ignore
        mode === "music"
          ? require("../../../assets/audio/music_bed.mp3")
          : require("../../../assets/audio/white_noise.mp3"),
        { shouldPlay: false, isLooping: true, volume: mode === "music" ? 0.22 : 0.08 }
      );

      bgRef.current = s;
      if (shouldPlay) await s.playAsync();
    } catch (e: any) {
      Alert.alert("Background audio error", String(e?.message ?? e));
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setBgReady(false);

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
        });

        await applyBgMode(bgMode, false);

        if (alive) setBgReady(true);
      } catch (e: any) {
        if (alive) {
          setBgReady(false);
          Alert.alert("Audio init failed", String(e?.message ?? e));
        }
      }
    })();

    return () => {
      alive = false;
      (async () => {
        stopAllTimers();
        stopRingAnim();
        Speech.stop();
        await stopBg();
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    hardReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  const hardReset = async () => {
    stopAllTimers();
    stopRingAnim();
    Speech.stop();

    setRunning(false);
    setPaused(false);
    setPrepping(false);
    setPrepCount(3);

    runningRef.current = false;
    pausedRef.current = false;
    preppingRef.current = false;

    const inhaleSeconds = getPhaseSeconds("inhale") || pattern.inhale || 4;
    phaseRef.current = "inhale";
    countRef.current = inhaleSeconds;
    setPhase("inhale");
    setCount(inhaleSeconds);
    animateForPhase("inhale");
    ringProgress.setValue(0);

    try {
      if (bgRef.current) {
        await bgRef.current.stopAsync().catch(() => {});
        await bgRef.current.setPositionAsync(0).catch(() => {});
      }
    } catch {}

    Animated.timing(scale, { toValue: 0.88, duration: 250, useNativeDriver: true }).start();
  };

  const startPrepCountdown = async () => {
    setPrepping(true);
    preppingRef.current = true;

    setPrepCount(3);
    startRingForSeconds(3);

    if (voiceOn) {
      Speech.stop();
      Speech.speak("Starting in three", {
        language: "en-GB",
        rate: 0.92,
        pitch: 1.0,
        volume: 0.7,
      });
    }

    if (prepRef.current) clearInterval(prepRef.current);

    let c = 3;
    prepRef.current = setInterval(() => {
      c -= 1;

      if (c <= 0) {
        if (prepRef.current) clearInterval(prepRef.current);
        prepRef.current = null;

        setPrepping(false);
        preppingRef.current = false;

        setPrepCount(0);

        if (voiceOn) speak("Begin", true);

        const inhaleSeconds = getPhaseSeconds("inhale") || pattern.inhale || 4;

        setPhaseAndCount("inhale", inhaleSeconds);
        startBreathTimer();
        return;
      }

      setPrepCount(c);

      if (voiceOn) {
        if (c === 4) speak("Four", true);
        if (c === 3) speak("Three", true);
        if (c === 2) speak("Two", true);
        if (c === 1) speak("One", true);
      }
    }, 1000);
  };

  const onStart = async () => {
    try {
      if (!bgReady) return;

      if (!running) {
        setRunning(true);
        setPaused(false);
        runningRef.current = true;
        pausedRef.current = false;

        await applyBgMode(bgMode, true);
        await startPrepCountdown();
        return;
      }

      if (paused) {
        setPaused(false);
        pausedRef.current = false;

        try {
          if (bgRef.current && bgMode !== "none") await bgRef.current.playAsync();
        } catch {}

        startRingForSeconds(Math.max(1, countRef.current));
        startBreathTimer();
      }
    } catch (e: any) {
      Alert.alert("Start failed", String(e?.message ?? e));
    }
  };

  const onPause = async () => {
    try {
      if (!running || paused) return;

      setPaused(true);
      pausedRef.current = true;

      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;

      if (prepRef.current) clearInterval(prepRef.current);
      prepRef.current = null;

      stopRingAnim();
      Speech.stop();

      try {
        if (bgRef.current) await bgRef.current.pauseAsync();
      } catch {}
    } catch {}
  };

  const setVoice = (on: boolean) => {
    setVoiceOn(on);
    if (!on) Speech.stop();
  };

  const onSetBgMode = async (mode: BgMode) => {
    setBgMode(mode);
    const shouldPlay = running && !paused && !prepping;
    await applyBgMode(mode, shouldPlay);
  };

  const circleGlow = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(100,255,255,0.08)", "rgba(255,255,255,0.18)"],
  });

  const shownCount = prepping ? prepCount : count;
  const shownLabel = prepping ? "GET READY" : PHASE_LABELS[phase];

  const OUTER_SIZE = 224;
  const INNER_SIZE = 176;
  const STROKE = 4;

  const R = OUTER_SIZE / 2 - STROKE;
  const CIRC = 2 * Math.PI * R;

  const dashOffset = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  const bottomPad = Math.max(18, insets.bottom + 14);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* ✅ KEEP stack header back button */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Breathing Sync",
          headerBackTitle: "Back",
          headerTintColor: "#F2F0EA",
          headerStyle: { backgroundColor: "#26384C" },
          headerTitleStyle: { fontWeight: "900" },
          headerShadowVisible: false,
        }}
      />

      <ImageBackground
        source={require("../../../assets/images/background_image.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        <View style={[styles.container, { paddingBottom: bottomPad }]}>
          {/* NO custom back button here */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>{pattern.name}</Text>
            <View style={{ height: 10 }} />
            <Text style={styles.sub}>{pattern.subtitle}</Text>
          </View>

          <View style={styles.optionsTile}>
            <View style={styles.optionsRow}>
              <Text style={styles.optionLabel}>Voice Guidance</Text>

              <View style={styles.voiceToggleWrap}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setVoice(true)}
                  style={[styles.voiceBtn, voiceOn ? styles.voiceBtnOn : styles.voiceBtnOff]}
                >
                  <Text style={styles.voiceBtnText}>ON</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setVoice(false)}
                  style={[styles.voiceBtn, !voiceOn ? styles.voiceBtnOn : styles.voiceBtnOff]}
                >
                  <Text style={styles.voiceBtnText}>OFF</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 18 }} />

            <Text style={styles.optionLabel}>Background Sound</Text>
            <View style={{ height: 12 }} />

            <View style={styles.bgRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onSetBgMode("music")}
                style={[styles.bgBtn, bgMode === "music" && styles.bgBtnActive]}
              >
                <Text style={styles.bgText}>Music</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onSetBgMode("noise")}
                style={[styles.bgBtn, bgMode === "noise" && styles.bgBtnActive]}
              >
                <Text style={styles.bgText}>Noise</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onSetBgMode("none")}
                style={[styles.bgBtn, bgMode === "none" && styles.bgBtnActive]}
              >
                <Text style={styles.bgText}>None</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.center}>
            <Animated.View style={[styles.circleOuter, { backgroundColor: circleGlow }]}>
              <View style={styles.ringWrap} pointerEvents="none">
                <Svg width={OUTER_SIZE} height={OUTER_SIZE}>
                  <Circle
                    cx={OUTER_SIZE / 2}
                    cy={OUTER_SIZE / 2}
                    r={R}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth={STROKE}
                    fill="transparent"
                  />
                  <AnimatedCircle
                    cx={OUTER_SIZE / 2}
                    cy={OUTER_SIZE / 2}
                    r={R}
                    stroke="rgba(242,240,234,0.92)"
                    strokeWidth={STROKE}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={`${CIRC} ${CIRC}`}
                    strokeDashoffset={dashOffset as any}
                    rotation={-90}
                    originX={OUTER_SIZE / 2}
                    originY={OUTER_SIZE / 2}
                  />
                </Svg>
              </View>

              <Animated.View style={[styles.circleInner, { transform: [{ scale }] }]}>
                <Text style={styles.phaseText}>{shownLabel}</Text>
                <Text style={styles.countText}>{String(clamp(shownCount, 0, 99))}</Text>
              </Animated.View>
            </Animated.View>

            {!bgReady ? (
              <View style={styles.audioLoading}>
                <ActivityIndicator />
                <Text style={styles.audioLoadingText}>Preparing audio…</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onStart}
              disabled={!bgReady}
              style={[styles.btn, styles.btnStart, !bgReady && styles.disabled]}
            >
              <Text style={styles.btnText}>
                {!running ? "Start" : paused ? "Resume" : prepping ? "Starting…" : "Running…"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onPause}
              disabled={!running || paused || prepping}
              style={[styles.btn, styles.btnPause, (!running || paused || prepping) && styles.disabled]}
            >
              <Text style={styles.btnText}>Pause</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={hardReset} style={[styles.btn, styles.btnReset]}>
              <Text style={styles.btnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const COLORS = {
  text: "#F2F0EA",
  textDim: "rgba(242,240,234,0.74)",
  border: "rgba(255,255,255,0.14)",
  panel: "rgba(255,255,255,0.10)",
  btnBorder: "rgba(255,255,255,0.18)",
  start: "rgba(34,197,94,0.78)",
  pause: "rgba(59,130,246,0.78)",
  reset: "rgba(255,255,255,0.14)",
  tile: "rgba(255,255,255,0.10)",
  tileBorder: "rgba(255,255,255,0.14)",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1020" },
  bg: { flex: 1 },

  overlayTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  overlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
    backgroundColor: "rgba(0,0,0,0.32)",
  },

  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  headerArea: {
    alignItems: "center",
    paddingTop: 1,
    paddingBottom: 5,
  },

  title: { color: COLORS.text, fontSize: 20, fontWeight: "900", textAlign: "center" },

  sub: {
    color: COLORS.textDim,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 2,
    fontWeight: "900",
  },

  optionsTile: {
    borderRadius: 16,
    backgroundColor: COLORS.tile,
    borderWidth: 1,
    borderColor: COLORS.tileBorder,
    padding: 14,
    marginTop: 6,
  },
  optionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionLabel: { color: "rgba(242,240,234,0.9)", fontWeight: "900", fontSize: 13, letterSpacing: 0.2 },

  voiceToggleWrap: { flexDirection: "row", gap: 10 },
  voiceBtn: {
    height: 34,
    minWidth: 62,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  voiceBtnOn: { backgroundColor: "rgba(34,197,94,0.28)", borderColor: "rgba(34,197,94,0.40)" },
  voiceBtnOff: { backgroundColor: "rgba(255,255,255,0.08)" },
  voiceBtnText: { color: COLORS.text, fontWeight: "900", letterSpacing: 0.3, fontSize: 12.5 },

  bgRow: { flexDirection: "row", gap: 10 },
  bgBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  bgBtnActive: { backgroundColor: "rgba(59,130,246,0.26)", borderColor: "rgba(59,130,246,0.40)" },
  bgText: { color: COLORS.text, fontWeight: "900", fontSize: 12.5, letterSpacing: 0.2 },

  center: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginTop: 8,
    paddingBottom: 6,
  },

  circleOuter: {
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  ringWrap: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 224,
    height: 224,
    alignItems: "center",
    justifyContent: "center",
  },

  circleInner: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  phaseText: {
    color: "rgba(242,240,234,0.92)",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  countText: { color: COLORS.text, fontSize: 58, fontWeight: "900", letterSpacing: 0.5 },

  audioLoading: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  audioLoadingText: { color: COLORS.textDim, fontWeight: "700" },

  controls: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 6,
  },

  btn: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.btnBorder,
  },
  btnStart: { backgroundColor: COLORS.start },
  btnPause: { backgroundColor: COLORS.pause },
  btnReset: { backgroundColor: COLORS.reset },

  btnText: { color: "#fff", fontWeight: "900", fontSize: 14, letterSpacing: 0.2 },
  disabled: { opacity: 0.55 },
});