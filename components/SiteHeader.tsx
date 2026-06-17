import Link from 'next/link';
import { getSessionUser } from '@/lib/supabase/server';
import Logo from './Logo';
import HeaderNav from './HeaderNav';

/* Floating pill header for the public/marketing pages. */
export default async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="site-header">
      <Link href="/" className="site-brand vb-chip" aria-label="Verbadium home"><Logo size={40} /></Link>
      <HeaderNav userEmail={user?.email ?? null} />
    </header>
  );
}
