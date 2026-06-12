import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/** Cookie-bound Supabase client for Server Components / Route Handlers,
    or null when credentials are placeholders. */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(toSet) {
        // Server Components cannot write cookies; middleware refreshes the session.
        try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* read-only context */ }
      },
    },
  });
}

/** Authenticated user for this request, or null (also null when unconfigured). */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch { return null; }
}
