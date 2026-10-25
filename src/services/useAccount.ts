import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface Account {
  configured: boolean;          // false when Supabase env vars are missing
  session: Session | null;
  email: string | null;
  credits: number | null;       // null while unknown / logged out
  setCredits: (credits: number) => void;
  refreshCredits: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

function requireClient() {
  if (!supabase) throw new Error('Les comptes ne sont pas encore configurés sur cette installation.');
  return supabase;
}

export function useAccount(): Account {
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const refreshCredits = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCredits(null);
      return;
    }
    const { data, error } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    if (!error && data) setCredits(data.credits);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) refreshCredits();
    else setCredits(null);
  }, [session, refreshCredits]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await requireClient().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await requireClient().auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    // With email confirmation enabled, Supabase returns no session until the link is clicked
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await requireClient().auth.signOut();
  }, []);

  return {
    configured: Boolean(supabase),
    session,
    email: session?.user.email ?? null,
    credits,
    setCredits,
    refreshCredits,
    signIn,
    signUp,
    signOut
  };
}
