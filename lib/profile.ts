import { supabase } from "./supabase";

export type Profile = {
  id: string;
  voice_id: string | null;
  voice_ready: boolean | null;
};

export async function getOrCreateProfile(userId: string): Promise<Profile> {
  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id, voice_id, voice_ready")
    .eq("id", userId)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing as Profile;

  const { data: created, error: insErr } = await supabase
    .from("profiles")
    .insert({ id: userId, voice_ready: false })
    .select("id, voice_id, voice_ready")
    .single();

  if (insErr) throw insErr;
  return created as Profile;
}

export async function setVoiceTrainingComplete(userId: string, voiceId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ voice_id: voiceId, voice_ready: true })
    .eq("id", userId);

  if (error) throw error;
}
