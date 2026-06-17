'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AccountMenu from './AccountMenu';

/* Centered nav island + right-hand actions. Logged in → an avatar dropdown
   (no email in the bar). Also adds active-link state + header scroll-shrink. */
export default function HeaderNav({ userEmail, isAdmin = false }: { userEmail: string | null; isAdmin?: boolean }) {
  const path = usePathname() ?? '/';
  const active = (href: string) => (path === href ? 'active' : '');

  // header scroll-shrink
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
      {userEmail ? (
        <AccountMenu userEmail={userEmail} isAdmin={isAdmin} />
      ) : (
        <div className="site-actions">
          <Link href="/login" data-test="header-login" className={active('/login')}>Log in</Link>
          <Link href="/signup" data-test="header-signup" className="site-cta">Sign up</Link>
        </div>
      )}
    </>
  );
}
