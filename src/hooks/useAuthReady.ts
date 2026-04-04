import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuthReady() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsReady(true);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        if (!mounted) return;

        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        setIsReady(true);
      })
      .catch(() => {
        if (mounted) setIsReady(true);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, isReady };
}