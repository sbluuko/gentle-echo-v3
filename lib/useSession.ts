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
        console.log("DEBUG getSession error:", error.message);
      }

      setSession(data.session ?? null);
      setIsLoading(false);
    }

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("DEBUG auth change event:", _event, newSession?.user?.id ?? null);
      setSession(newSession ?? null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}
