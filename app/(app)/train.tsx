import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity } from "react-native";

const MAKE_CREATEVOICE_URL =
  "PASTE_YOUR_MAKE_CREATEVOICE_WEBHOOK_URL_HERE";

const MIN_SECONDS = 45;

export default function Train() {
  const router = useRouter();
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  const startRecording = async () => {
    try {
      setBusy(true);
      setRecordingUri(null);
      setDurationSec(0);

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
    } catch (e: any) {
      Alert.alert("Recording error", String(e));
    } finally {
      setBusy(false);
    }
  };

  const stopRecording = async () => {
    try {
      setBusy(true);
      const rec = recordingRef.current;
      if (!rec) return;

      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const status = await rec.getStatusAsync();

      recordingRef.current = null;
      setRecordingUri(uri ?? null);
      setDurationSec(Math.floor((status.durationMillis ?? 0) / 1000));
    } catch (e: any) {
      Alert.alert("Stop error", String(e));
    } finally {
      setBusy(false);
    }
  };

  const uploadTraining = async () => {
    if (!recordingUri) return;

    if (durationSec < MIN_SECONDS) {
      Alert.alert(
        "Recording too short",
        `Please record at least ${MIN_SECONDS} seconds.`
      );
      return;
    }

    try {
      setBusy(true);

      const fs: any = FileSystem as any;
      const uploadType =
        fs?.FileSystemUploadType?.MULTIPART ?? ("multipart" as any);

      const res = await FileSystem.uploadAsync(
        MAKE_CREATEVOICE_URL,
        recordingUri,
        {
          httpMethod: "POST",
          uploadType,
          fieldName: "file",
          mimeType: "audio/m4a",
          parameters: {
            mode: "train",
          },
        }
      );

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Training failed (${res.status})`);
      }

      Alert.alert(
        "Voice Created",
        "Training complete. You will now be taken to the app.",
        [
          {
            text: "Continue",
            onPress: () => router.replace("/main"),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Training error", String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>
        Voice Training
      </Text>

      <Text style={{ marginVertical: 12 }}>
        Record a calm, natural voice sample (45–60 seconds).
        This will be used to create your personal voice.
      </Text>

      <TouchableOpacity onPress={startRecording} disabled={busy}>
        <Text>Start Training Recording</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={stopRecording} disabled={busy}>
        <Text>Stop Recording</Text>
      </TouchableOpacity>

      <Text>
        Duration: {durationSec > 0 ? `${durationSec}s` : "(not recorded)"}
      </Text>

      <TouchableOpacity
        onPress={uploadTraining}
        disabled={busy || !recordingUri}
      >
        <Text>Create Voice</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
