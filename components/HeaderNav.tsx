'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getDict, PATHS, type Locale, type PageKey } from '@/lib/i18n';

/* Centered nav island. Adds active-link state + header scroll-shrink. The
   account control is a sibling (<AccountSlot/>) so the header stays static. */
export default function HeaderNav({ lang = 'en', page = 'home' }: { lang?: Locale; page?: PageKey }) {
  const path = usePathname() ?? '/';
  const active = (href: string) => (path === href ? 'active' : '');
  const d = getDict(lang);
  void page;

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
    <nav className="site-nav">
      {lang === 'en' ? (
        <>
          <Link href="/" className={active('/')}>Courses</Link>
          <Link href="/pricing" className={active('/pricing')}>Pricing</Link>
        </>
      ) : (
        <>
          <Link href={(PATHS.course as Record<string, string>)[lang]} className={active((PATHS.course as Record<string, string>)[lang])}>{d.nav.course}</Link>
          <Link href="/pricing" className={active('/pricing')}>{d.nav.pricing}</Link>
        </>
      )}
    </nav>
  );
}
