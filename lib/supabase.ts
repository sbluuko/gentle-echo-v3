import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { ENV } from "./env";

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

