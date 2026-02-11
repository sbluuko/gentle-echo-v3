import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        // ✅ If refresh token is invalid/missing, wipe local auth so app can recover cleanly
        const msg = String(error.message || "");
        if (msg.toLowerCase().includes("invalid refresh token")) {
          await supabase.auth.signOut();
          setSession(null);
          setIsLoading(false);
          return;
        }
      }

      setSession(data.session ?? null);
      setIsLoading(false);
    }

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}
