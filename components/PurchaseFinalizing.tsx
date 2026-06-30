'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';

/* Shown right after Paddle redirects back (?purchased=1) while the user isn't
   owned YET — access is granted by the transaction.completed webhook, which
   lands a few seconds after the redirect. We soft-refresh the server component
   every few seconds; once the webhook writes the purchase, the page re-renders
   as the owned dashboard and this unmounts. Stops after ~30s with a manual
   fallback so we never poll forever. */
const INTERVAL_MS = 2500;
const MAX_TRIES = 12;   // ~30s

export default function PurchaseFinalizing(
  { received, unlocking, slow, refresh }: { received: string; unlocking: string; slow: string; refresh: string },
) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  const gaveUp = tries >= MAX_TRIES;

  // Fired once when the buyer returns from Paddle (?purchased=1) — funnel
  // conversion signal. Revenue's source of truth stays the webhook/DB.
  useEffect(() => { track('purchase'); }, []);

  useEffect(() => {
    if (gaveUp) return;
    const t = setTimeout(() => { setTries(n => n + 1); router.refresh(); }, INTERVAL_MS);
    return () => clearTimeout(t);
  }, [tries, gaveUp, router]);

  return (
    <div className="card purchase-finalizing" data-test="purchase-finalizing" role="status" aria-live="polite">
      <h2>{received}</h2>
      <p>{gaveUp ? slow : unlocking}</p>
      {gaveUp
        ? <button type="button" className="btn btn-primary" onClick={() => { setTries(0); router.refresh(); }}>{refresh}</button>
        : <span className="vb-spinner" aria-hidden="true" />}
    </div>
  );
}
