import { useCallback, useEffect, useRef, useState } from "react";
import { getOrCreateProfile, type Profile } from "./profile";
import { supabase } from "./supabase";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    if (mountedRef.current) setIsLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;

      if (!userId) {
        if (!mountedRef.current) return;
        setProfile(null);
        return;
      }

      const p = await getOrCreateProfile(userId);

      if (!mountedRef.current) return;
      setProfile(p);
    } catch (e) {
      console.log("DEBUG useProfile load error:", e);
      if (!mountedRef.current) return;
      setProfile(null);
    } finally {
      inFlightRef.current = false;
      if (!mountedRef.current) return;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      mountedRef.current = false;
      authSub.subscription.unsubscribe();
    };
  }, [load]);

  return {
    profile,
    isLoading,
    refreshProfile: load,
  };
}