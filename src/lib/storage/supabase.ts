import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Single-user Supabase client. The anon key is exposed to the browser by
 * design — RLS policies grant the anon role full access (see supabase/schema.sql).
 *
 * Do NOT deploy this app publicly without first adding auth + scoping policies.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (client) return client;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
    );
  }
  client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
};

export const isSupabaseConfigured = (): boolean => Boolean(url && anonKey);
