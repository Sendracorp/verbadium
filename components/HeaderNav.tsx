'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import SignOutButton from './SignOutButton';

/* Renders the centered nav island + the right-hand actions island as siblings
   of the logo (all grid children of .site-header). Adds active-link state and a
   scroll-shrink class on the header. */
export default function HeaderNav({ userEmail }: { userEmail: string | null }) {
  const path = usePathname() ?? '/';
  const active = (href: string) => (path === href ? 'active' : '');

  useEffect(() => {
    const h = document.querySelector('.site-header');
    if (!h) return;
    const onScroll = () => h.classList.toggle('scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className="site-nav">
        <Link href="/" className={active('/')}>Courses</Link>
        <Link href="/pricing" className={active('/pricing')}>Pricing</Link>
      </nav>
      <div className="site-actions">
        {userEmail ? (
          <>
            <Link href="/account" data-test="account-link" className={active('/account')}>{userEmail}</Link>
            <SignOutButton className="site-signout" />
          </>
        ) : (
          <>
            <Link href="/login" data-test="header-login" className={active('/login')}>Log in</Link>
            <Link href="/signup" data-test="header-signup" className="site-cta">Sign up</Link>
          </>
        )}
      </div>
    </>
  );
}
