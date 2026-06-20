'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AccountMenu from './AccountMenu';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { getDict, type Locale } from '@/lib/i18n';

/* Header account control, resolved client-side so the marketing/legal pages
   can be statically rendered (no per-request session read on the server).
   Renders logged-out by default — correct for crawlers and the common case —
   then swaps to the avatar if a session is present. */
export default function AccountSlot({ lang = 'en' }: { lang?: Locale }) {
  const d = getDict(lang);
  const [acct, setAcct] = useState<{ email: string; isAdmin: boolean } | null>(null);

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    let active = true;
    sb.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u || !active) return;
      let isAdmin = false;
      try {
        const { data: p } = await sb.from('profiles').select('is_admin').eq('id', u.id).maybeSingle();
        isAdmin = !!p?.is_admin;
      } catch { /* ignore — admin link just won't show */ }
      if (active) setAcct({ email: u.email ?? '', isAdmin });
    });
    return () => { active = false; };
  }, []);

  if (acct) return <AccountMenu userEmail={acct.email} isAdmin={acct.isAdmin} />;
  return (
    <div className="site-actions">
      <Link href="/login" data-test="header-login">{d.nav.login}</Link>
      <Link href="/signup" data-test="header-signup" className="site-cta">{d.nav.signup}</Link>
    </div>
  );
}
