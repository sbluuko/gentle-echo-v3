// app/(app)/affirmations/audioFocus.ts
import { Audio } from "expo-av";
import { AppState, AppStateStatus } from "react-native";

type Handlers = {
  pause: () => Promise<void> | void;
  resume: () => Promise<void> | void;
  isPlayingNow: () => boolean;
};

function getIOSInterruptionMode() {
  // Newer expo-av
  const v = (Audio as any)?.InterruptionModeIOS?.DuckOthers;
  if (v != null) return v;

  // Older expo-av fallback (if present)
  const legacy = (Audio as any)?.INTERRUPTION_MODE_IOS_DUCK_OTHERS;
  if (legacy != null) return legacy;

  // Safe default
  return undefined;
}

function getAndroidInterruptionMode() {
  const v = (Audio as any)?.InterruptionModeAndroid?.DuckOthers;
  if (v != null) return v;

  const legacy = (Audio as any)?.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS;
  if (legacy != null) return legacy;

  return undefined;
}

export async function configureGlobalAudioModeOnce() {
  const interruptionModeIOS = getIOSInterruptionMode();
  const interruptionModeAndroid = getAndroidInterruptionMode();

  // Build options only with fields that exist (avoids runtime/type issues)
  const opts: any = {
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    staysActiveInBackground: false,
  };

  if (interruptionModeIOS != null) opts.interruptionModeIOS = interruptionModeIOS;
  if (interruptionModeAndroid != null) opts.interruptionModeAndroid = interruptionModeAndroid;

  await Audio.setAudioModeAsync(opts);
}

export function attachInterruptionHandlers(handlers: Handlers) {
  let lastAppState: AppStateStatus = AppState.currentState;
  let shouldResume = false;

  const sub = AppState.addEventListener("change", async (next) => {
    const wasActive = lastAppState === "active";
    const isNowInactive = next === "background" || next === "inactive";

    if (wasActive && isNowInactive) {
      if (handlers.isPlayingNow()) {
        shouldResume = true;
        await handlers.pause();
      } else {
        shouldResume = false;
      }
    }

    if ((lastAppState === "background" || lastAppState === "inactive") && next === "active") {
      if (shouldResume) {
        shouldResume = false;
        await handlers.resume();
      }
    }

    lastAppState = next;
  });

  return () => sub.remove();
}
