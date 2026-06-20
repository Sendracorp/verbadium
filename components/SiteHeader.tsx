import Link from 'next/link';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import Logo from './Logo';
import HeaderNav from './HeaderNav';
import { PATHS, type Locale, type PageKey } from '@/lib/i18n';

/* Floating pill header for the public/marketing pages. `lang`/`page` localize
   the nav + brand link (English defaults — existing pages are unaffected). */
export default async function SiteHeader({ lang = 'en', page = 'home' }: { lang?: Locale; page?: PageKey } = {}) {
  const user = await getSessionUser();
  let isAdmin = false;
  if (user) {
    const supabase = await getServerSupabase();
    const { data: profile } = await supabase!
      .from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
    isAdmin = !!profile?.is_admin;
  }
  return (
    <header className="site-header">
      <Link href={PATHS.home[lang]} className="site-brand vb-chip" aria-label="Verbadium home"><Logo size={40} /></Link>
      <HeaderNav userEmail={user?.email ?? null} isAdmin={isAdmin} lang={lang} page={page} />
    </header>
  );
}
