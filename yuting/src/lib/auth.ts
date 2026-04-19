'use client';

import { useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from './supabase-browser';

/**
 * Send a Magic Link to the given email.
 * The link redirects to /auth/callback and completes login automatically.
 */
export async function signIn(email: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { error: error?.message ?? null };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/**
 * React hook that tracks the current auth state.
 * Returns `{ user, session, loading }`.
 */
export function useAuth(): { user: User | null; session: Session | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}
