import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and sync Google avatar if needed
  const fetchProfile = useCallback(async (userId: string, userMetadata?: Record<string, any>) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    // Create an initial profile row if missing (keeps profile edits + avatar updates working)
    if (!data) {
      const initialDisplayName = (userMetadata?.display_name as string | undefined) ?? null;

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({ user_id: userId, display_name: initialDisplayName })
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return null;
      }

      setProfile(created);
      return created;
    }

    // Auto-sync Google avatar to profile if profile has no avatar
    if (!data.avatar_url && userMetadata) {
      const googleAvatar = userMetadata.avatar_url || userMetadata.picture;
      if (googleAvatar) {
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({ avatar_url: googleAvatar })
          .eq('user_id', userId)
          .select()
          .single();

        if (updatedProfile) {
          setProfile(updatedProfile);
          return updatedProfile;
        }
      }
    }

    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety timeout — never stay stuck on loading for more than 5 seconds
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[useAuth] Safety timeout reached — forcing loading=false");
        setLoading(false);
      }
    }, 5000);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            if (mounted) fetchProfile(session.user.id, session.user.user_metadata);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile openid',
      },
    });
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Try update first
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) return { data: null, error };

    // If profile row doesn't exist yet, create it
    if (!data) {
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, ...updates })
        .select()
        .single();

      if (created) setProfile(created);
      return { data: created ?? null, error: createError };
    }

    setProfile(data);
    return { data, error: null };
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    fetchProfile,
  };
}
