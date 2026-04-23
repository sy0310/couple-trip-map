'use client';

import { useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from './supabase-browser';

/**
 * Sign in with email and password.
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  return { error: error?.message ?? null };
}

/**
 * Sign up with email and password.
 */
export async function signUp(
  email: string,
  password: string,
  nickname: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { nickname: nickname.trim() },
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
