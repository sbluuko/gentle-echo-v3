import { supabase } from "./supabase";

export type Profile = {
  id: string;
  voice_ready: boolean | null;
  voice_id: string | null;
  created_at?: string | null;
};

export async function getOrCreateProfile(userId: string): Promise<Profile> {
  // 1) Try to read existing profile
  const { data: existing, error: readErr } = await supabase
    .from("profiles")
    .select("id, voice_ready, voice_id, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (readErr) {
    throw readErr;
  }

  if (existing) {
    return existing as Profile;
  }

  // 2) If missing, create it safely (idempotent)
  // IMPORTANT: use upsert with onConflict so duplicate inserts never fail
  const { data: created, error: upsertErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        // set sensible defaults; adjust if your table has different defaults
        voice_ready: false,
        voice_id: null,
      },
      { onConflict: "id" }
    )
    .select("id, voice_ready, voice_id, created_at")
    .single();

  if (upsertErr) {
    throw upsertErr;
  }

  return created as Profile;
}
