import { useEffect, useState } from "react";
import { getOrCreateProfile, type Profile } from "./profile";
import { supabase } from "./supabase";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);

      const { data, error } = await supabase.auth.getSession();
      if (error) console.log("DEBUG getSession error:", error.message);

      const userId = data.session?.user?.id;

      if (!userId) {
        if (!mounted) return;
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        const p = await getOrCreateProfile(userId);
        if (!mounted) return;
        setProfile(p);
      } catch (e) {
        console.log("DEBUG useProfile load error:", e);
        if (!mounted) return;
        setProfile(null);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    load();

    // Reload profile after auth changes
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
