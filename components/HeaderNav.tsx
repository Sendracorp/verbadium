'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import SignOutButton from './SignOutButton';

/* Centered nav island + right-hand actions. Logged in → an avatar dropdown
   (no email in the bar). Also adds active-link state + header scroll-shrink. */
export default function HeaderNav({ userEmail, isAdmin = false }: { userEmail: string | null; isAdmin?: boolean }) {
  const path = usePathname() ?? '/';
  const active = (href: string) => (path === href ? 'active' : '');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // header scroll-shrink
  useEffect(() => {
    const h = document.querySelector('.site-header');
    if (!h) return;
    const onScroll = () => h.classList.toggle('scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close the account menu on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <>
      <nav className="site-nav">
        <Link href="/" className={active('/')}>Courses</Link>
        <Link href="/pricing" className={active('/pricing')}>Pricing</Link>
      </nav>
      {userEmail ? (
        <div className="account-menu" ref={menuRef}>
          <button
            type="button" className="avatar-btn" data-test="account-menu"
            aria-haspopup="menu" aria-expanded={open} aria-label="Account menu"
            onClick={() => setOpen(o => !o)}
          >
            <span className="avatar">{userEmail[0]?.toUpperCase() || '·'}</span>
          </button>
          {open && (
            <div className="account-dropdown" role="menu">
              <div className="account-dropdown-email" data-test="account-email">{userEmail}</div>
              <Link href="/" role="menuitem" onClick={() => setOpen(false)}>My courses &amp; progress</Link>
              <Link href="/account" role="menuitem" onClick={() => setOpen(false)}>Account &amp; purchases</Link>
              {isAdmin && (
                <Link href="/admin" role="menuitem" data-test="account-admin" className="account-dropdown-admin" onClick={() => setOpen(false)}>Admin dashboard</Link>
              )}
              <div className="account-dropdown-sep" />
              <SignOutButton className="account-dropdown-signout" />
            </div>
          )}
        </div>
      ) : (
        <div className="site-actions">
          <Link href="/login" data-test="header-login" className={active('/login')}>Log in</Link>
          <Link href="/signup" data-test="header-signup" className="site-cta">Sign up</Link>
        </div>
      )}
    </>
  );
}
