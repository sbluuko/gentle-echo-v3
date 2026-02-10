import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import React, { useRef, useState } from "react";
import { Alert, Platform, ScrollView, Text, TouchableOpacity } from "react-native";

const MAKE_PROCESSMESSAGE_URL =
  "https://hook.us2.make.com/3warr9f3b4llyy8lfzod7tksl3n82vfw";

export default function Main() {
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [makeRaw, setMakeRaw] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [downloadStatus, setDownloadStatus] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState("");

  // ========================
  // Recording
  // ========================
  const startRecording = async () => {
    try {
      setBusy(true);

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Microphone permission is required.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
    } catch (e: any) {
      Alert.alert("Record error", String(e?.message ?? e));
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
      recordingRef.current = null;

      setRecordedUri(uri ?? null);
    } catch (e: any) {
      Alert.alert("Stop error", String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  // ========================
  // Upload to Make (ProcessMessage)
  // ========================
  const processMessage = async () => {
    if (!recordedUri) return;

    try {
      setBusy(true);
      setMakeRaw("");
      setFinalUrl("");
      setDownloadError("");
      setDownloadStatus(null);

      const fs: any = FileSystem as any;
      const uploadType =
        fs?.FileSystemUploadType?.MULTIPART ?? ("multipart" as any);

      const res = await FileSystem.uploadAsync(
        MAKE_PROCESSMESSAGE_URL,
        recordedUri,
        {
          httpMethod: "POST",
          uploadType,
          fieldName: "file",
          mimeType: Platform.OS === "ios" ? "audio/m4a" : "audio/mp4",
          parameters: {
            mode: "message",
            user_id: "bb29dbdd-ed5e-46cb-afb8-560acbddf551", // <-- keep your real id here
          },
        }
      );

      const body = res.body ?? "";
      setMakeRaw(`status=${res.status}\nbody=\n${body}`);

      if (res.status < 200 || res.status >= 300) {
        throw new Error(body || `Make failed (${res.status})`);
      }

      // ✅ Accept BOTH formats:
      // { "processedAudioUrl": "https://..." }   (new)
      // { "s3_url": "https://..." }             (old)
      let parsed: any = {};
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        parsed = {};
      }

      const url =
        (typeof parsed?.processedAudioUrl === "string" && parsed.processedAudioUrl) ||
        (typeof parsed?.s3_url === "string" && parsed.s3_url) ||
        "";

      if (!url) {
        throw new Error(
          `Make returned 200 but no URL found. Expected JSON like {"processedAudioUrl":"https://..."} (or {"s3_url":"https://..."})`
        );
      }

      setFinalUrl(url);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      Alert.alert("Processing error", msg);
      setMakeRaw(`ERROR:\n${msg}`);
    } finally {
      setBusy(false);
    }
  };

  // ========================
  // Download final audio
  // ========================
  const downloadAudio = async () => {
    if (!finalUrl) return;

    try {
      setBusy(true);
      setDownloadError("");
      setDownloadStatus(null);

      const fs: any = FileSystem as any;
      const base = fs?.documentDirectory;

      if (!base) {
        setDownloadError("documentDirectory unavailable on device");
        return;
      }

      const target = `${base}gentleecho_last_message.mp3`;

      const res = await FileSystem.downloadAsync(finalUrl, target);
      setDownloadStatus(res.status);

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`HTTP ${res.status}`);
      }

      Alert.alert("Downloaded", "Audio saved to device");
    } catch (e: any) {
      setDownloadError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>
        Gentle Echo – Main (DEBUG)
      </Text>

      <TouchableOpacity onPress={startRecording} disabled={busy}>
        <Text>Start Recording</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={stopRecording} disabled={busy}>
        <Text>Stop Recording</Text>
      </TouchableOpacity>

      <Text selectable>Recorded URI: {recordedUri ?? "(none)"}</Text>

      <TouchableOpacity onPress={processMessage} disabled={busy || !recordedUri}>
        <Text>Process Message</Text>
      </TouchableOpacity>

      <Text selectable>Make response:</Text>
      <Text selectable>{makeRaw || "(none)"}</Text>

      <Text selectable>Final URL:</Text>
      <Text selectable>{finalUrl || "(none)"}</Text>

      <TouchableOpacity onPress={downloadAudio} disabled={busy || !finalUrl}>
        <Text>Download Audio</Text>
      </TouchableOpacity>

      <Text>HTTP status: {downloadStatus ?? "(none)"}</Text>
      <Text selectable style={{ color: "red" }}>
        {downloadError || ""}
      </Text>
    </ScrollView>
  );
}
