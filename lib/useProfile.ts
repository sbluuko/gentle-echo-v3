import { useEffect, useRef, useState } from "react";
import { getOrCreateProfile, type Profile } from "./profile";
import { supabase } from "./supabase";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const inFlightRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (inFlightRef.current) return; // ✅ prevent overlap
      inFlightRef.current = true;

      setIsLoading(true);

      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;

        if (!userId) {
          if (!mounted) return;
          setProfile(null);
          return;
        }

        const p = await getOrCreateProfile(userId);
        if (!mounted) return;
        setProfile(p);
      } catch (e) {
        console.log("DEBUG useProfile load error:", e);
        if (!mounted) return;
        setProfile(null);
      } finally {
        inFlightRef.current = false;
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { profile, isLoading };
}
