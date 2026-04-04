import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuthReady() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const resolve = (s: Session | null) => {
      if (!mounted || resolved) return;
      resolved = true;
      setSession(s);
      setUser(s?.user ?? null);
      setIsReady(true);
    };

    // Listen for auth changes FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      // Always update on subsequent changes even after initial resolve
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!resolved) {
        resolved = true;
        setIsReady(true);
      }
    });

    // THEN check existing session
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        resolve(existingSession);
      })
      .catch(() => {
        resolve(null);
      });

    // Safety: always resolve after 4 seconds
    const safety = setTimeout(() => resolve(null), 4000);

    return () => {
      mounted = false;
      clearTimeout(safety);
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, isReady };
}