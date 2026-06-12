/* Shared env access for Supabase. The app must run (logged-out, paywalled)
   even with placeholder credentials, so everything checks isSupabaseConfigured()
   before making network calls. */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return /^https:\/\/(?!YOUR-PROJECT)[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL)
    && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.startsWith('YOUR-');
}
