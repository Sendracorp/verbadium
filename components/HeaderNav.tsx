'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AccountMenu from './AccountMenu';
import { getDict, PATHS, type Locale, type PageKey } from '@/lib/i18n';

/* Centered nav island + right-hand actions. Logged in → an avatar dropdown
   (no email in the bar). Also adds active-link state + header scroll-shrink. */
export default function HeaderNav(
  { userEmail, isAdmin = false, lang = 'en', page = 'home' }:
  { userEmail: string | null; isAdmin?: boolean; lang?: Locale; page?: PageKey },
) {
  const path = usePathname() ?? '/';
  const active = (href: string) => (path === href ? 'active' : '');
  const d = getDict(lang);

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
        {lang === 'en' ? (
          <>
            <Link href="/" className={active('/')}>Courses</Link>
            <Link href="/pricing" className={active('/pricing')}>Pricing</Link>
          </>
        ) : (
          <Link href={PATHS.course[lang]} className={active(PATHS.course[lang])}>{d.nav.course}</Link>
        )}
      </nav>
      {userEmail ? (
        <AccountMenu userEmail={userEmail} isAdmin={isAdmin} />
      ) : (
        <div className="site-actions">
          <Link href="/login" data-test="header-login" className={active('/login')}>{d.nav.login}</Link>
          <Link href="/signup" data-test="header-signup" className="site-cta">{d.nav.signup}</Link>
        </div>
      )}
    </>
  );
}
