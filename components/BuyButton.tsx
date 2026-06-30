'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js';
import { track } from '@vercel/analytics';
import { interpolate, type BuyLabels } from '@/lib/ui-runtime';
import { getAttribution } from '@/lib/attribution';

/* Opens the Paddle overlay checkout. /api/checkout is the auth gate —
   401 sends the user to /login and back here afterwards. Access itself is
   granted by the transaction.completed webhook, not the success redirect.
   Takes pre-resolved `labels` (not useUI) — also used outside the course
   provider, and avoids pulling the whole UI map into the client bundle. */
export default function BuyButton({ courseSlug, priceLabel, returnTo, labels }: {
  courseSlug: string;
  priceLabel: string;
  returnTo: string;
  labels: BuyLabels;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(returnTo)}`);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? labels.errStart);
        return;
      }
      const paddle = await initializePaddle({ environment: body.environment, token: body.clientToken });
      if (!paddle) {
        setError(labels.errLoad);
        return;
      }
      const attribution = getAttribution();
      track('checkout_opened', { course: courseSlug, source: attribution?.utm_source ?? (attribution?.gclid ? 'google-ads' : undefined) ?? attribution?.referrer ?? 'direct' });
      paddle.Checkout.open({
        items: [{ priceId: body.priceId, quantity: 1 }],
        customer: { email: body.email },
        customData: { user_id: body.userId, course_slug: courseSlug, ...(attribution ? { attribution } : {}) },
        settings: {
          displayMode: 'overlay',
          successUrl: `${window.location.origin}${returnTo}?purchased=1`,
        },
      });
    } catch {
      setError(labels.errConn);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="buy-wrap">
      <button type="button" className="btn btn-primary buy-btn" onClick={buy} disabled={busy}>
        {busy ? labels.opening : interpolate(labels.buy, { price: priceLabel })}
      </button>
      {error && <span className="buy-error">{error}</span>}
    </span>
  );
}
