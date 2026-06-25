'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

/* Informational cookie notice (NOT a consent gate): we only use essential +
   functional cookies and cookieless analytics, so no opt-in is required. The
   "dismissed" flag lives in localStorage — it is not a tracking cookie. */
const KEY = 'vb-cookie-notice';

export default function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch { /* storage blocked */ }
  }, []);
  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* storage blocked */ }
    setShow(false);
  };

  return (
    <div className="cookie-notice" role="region" aria-label="Cookie notice">
      <p className="cookie-notice-text">
        We use only essential cookies to run the site and keep you signed in, plus
        privacy-friendly, cookieless analytics. No ads, no third-party tracking.{' '}
        <Link href="/cookies">Learn more</Link>.
      </p>
      <button type="button" className="btn btn-primary cookie-notice-btn" onClick={dismiss}>
        Got it
      </button>
    </div>
  );
}
