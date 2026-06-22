'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js';
import { tUI } from '@/lib/ui';
import type { Locale } from '@/lib/i18n';

/* Opens the Paddle overlay checkout. /api/checkout is the auth gate —
   401 sends the user to /login and back here afterwards. Access itself is
   granted by the transaction.completed webhook, not the success redirect.
   Takes a `locale` prop (not useUI) — also used outside the course provider. */
export default function BuyButton({ courseSlug, priceLabel, returnTo, locale = 'en' }: {
  courseSlug: string;
  priceLabel: string;
  returnTo: string;
  locale?: Locale;
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
        setError(body.error ?? tUI(locale, 'buy.errStart'));
        return;
      }
      const paddle = await initializePaddle({ environment: body.environment, token: body.clientToken });
      if (!paddle) {
        setError(tUI(locale, 'buy.errLoad'));
        return;
      }
      paddle.Checkout.open({
        items: [{ priceId: body.priceId, quantity: 1 }],
        customer: { email: body.email },
        customData: { user_id: body.userId, course_slug: courseSlug },
        settings: {
          displayMode: 'overlay',
          successUrl: `${window.location.origin}${returnTo}?purchased=1`,
        },
      });
    } catch {
      setError(tUI(locale, 'buy.errConn'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="buy-wrap">
      <button type="button" className="btn btn-primary buy-btn" onClick={buy} disabled={busy}>
        {busy ? tUI(locale, 'buy.opening') : tUI(locale, 'buy.buy', { price: priceLabel })}
      </button>
      {error && <span className="buy-error">{error}</span>}
    </span>
  );
}
