import { createClient, SupabaseClient } from '@supabase/supabase-js';

// The anon key is public by design: access is enforced by Row Level Security and the
// "generate" Edge Function. The Gemini key never reaches the browser.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// null when the project isn't configured yet: the app then runs in free catalogue mode only
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
