import Link from 'next/link';
import { getSessionUser } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

/* Top bar for non-course pages (catalog, auth, account, admin). */
export default async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="site-header">
      <Link href="/" className="site-brand">Català <span>from Scratch</span></Link>
      <nav className="site-nav">
        <Link href="/">Courses</Link>
        {user ? (
          <>
            <Link href="/account" data-test="account-link">{user.email}</Link>
            <SignOutButton className="site-signout" />
          </>
        ) : (
          <>
            <Link href="/login" data-test="header-login">Log in</Link>
            <Link href="/signup" className="site-cta" data-test="header-signup">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
