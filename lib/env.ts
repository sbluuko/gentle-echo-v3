function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name} (set it in .env)`);
  return v;
}

export const ENV = {
  SUPABASE_URL: req("EXPO_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: req("EXPO_PUBLIC_SUPABASE_ANON_KEY"),

  MAKE_VOICE_TRAIN_URL: req("EXPO_PUBLIC_MAKE_VOICE_TRAIN_URL"),
  MAKE_PROCESS_MESSAGE_URL: req("EXPO_PUBLIC_MAKE_PROCESS_MESSAGE_URL"),
  MAKE_ACK_DELETE_URL: req("EXPO_PUBLIC_MAKE_ACK_DELETE_URL"),
} as const;
