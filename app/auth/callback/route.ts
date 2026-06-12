import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase/server';

/* Lands every Supabase redirect: OAuth (PKCE code), email confirmation and
   password-recovery links (token_hash). Exchanges it for a session cookie,
   then continues to ?next=. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const supabase = await getServerSupabase();
  if (supabase) {
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    try {
      if (code) await supabase.auth.exchangeCodeForSession(code);
      else if (tokenHash && type) await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    } catch { /* expired/invalid link → continue logged out */ }
  }
  return NextResponse.redirect(`${origin}${safeNext}`);
}
