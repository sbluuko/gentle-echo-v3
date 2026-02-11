import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://xnzxwactchbeqkpnhbqf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuenh3YWN0Y2hiZXFrcG5oYnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTk4ODcsImV4cCI6MjA4MjI3NTg4N30.-EIzlG3YUCraiR1kRt_-e6JTcQMAeSWzU4nGhyh_0nc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
