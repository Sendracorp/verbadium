'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import SignOutButton from './SignOutButton';

/* Avatar pill + dropdown used wherever a logged-in user appears (site header,
   course view). Closes on outside-click / Escape. */
export default function AccountMenu({ userEmail, isAdmin = false }: {
  userEmail: string; isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
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
  );
}
