import Link from 'next/link';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import Logo from './Logo';
import HeaderNav from './HeaderNav';

/* Floating pill header for the public/marketing pages. */
export default async function SiteHeader() {
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
      <Link href="/" className="site-brand vb-chip" aria-label="Verbadium home"><Logo size={40} /></Link>
      <HeaderNav userEmail={user?.email ?? null} isAdmin={isAdmin} />
    </header>
  );
}
