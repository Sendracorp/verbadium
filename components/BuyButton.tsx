'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/* Starts a Lemon Squeezy checkout via /api/checkout. Requires login —
   401 sends the user to /login and back here afterwards. */
export default function BuyButton({ courseSlug, priceLabel, returnTo }: {
  courseSlug: string;
  priceLabel: string;
  returnTo: string;
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
      if (!res.ok || !body.url) {
        setError(body.error ?? 'Could not start checkout. Please try again.');
        return;
      }
      window.location.href = body.url;
    } catch {
      setError('Could not start checkout. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="buy-wrap">
      <button type="button" className="btn btn-primary buy-btn" onClick={buy} disabled={busy}>
        {busy ? 'Opening checkout…' : `Buy the course · ${priceLabel}`}
      </button>
      {error && <span className="buy-error">{error}</span>}
    </span>
  );
}
