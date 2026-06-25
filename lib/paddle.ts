import 'server-only';
import { familyOf } from './courses';

/* Paddle Billing (merchant of record — supports Andorra-based sellers, unlike
   Stripe/Lemon Squeezy). Checkout happens client-side via the Paddle.js
   overlay; the server gates (/api/checkout), verifies the webhook, and reads
   the live price (PADDLE_API_KEY) so the displayed price === the charged one. */

export function paddleEnvironment(): 'sandbox' | 'production' {
  return process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox';
}

function paddleApiBase(): string {
  return paddleEnvironment() === 'production'
    ? 'https://api.paddle.com'
    : 'https://sandbox-api.paddle.com';
}

function paddleApiKey(): string | null {
  const k = process.env.PADDLE_API_KEY ?? '';
  return k && !k.startsWith('YOUR-') ? k : null;
}

export interface PaddlePrice { amountMinor: number; currency: string }

/** Live unit price for a course from the Paddle API, or null if unavailable
    (no API key, no price ID, or the request fails). Cached for an hour. */
export async function getPaddlePrice(courseSlug: string): Promise<PaddlePrice | null> {
  const key = paddleApiKey();
  const priceId = priceIdFor(courseSlug);
  if (!key || !priceId) return null;
  try {
    const res = await fetch(`${paddleApiBase()}/prices/${priceId}`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const up = body?.data?.unit_price;
    const amountMinor = Number(up?.amount);
    if (!up?.currency_code || !Number.isFinite(amountMinor)) return null;
    return { amountMinor, currency: up.currency_code };
  } catch {
    return null;
  }
}

export function paddleClientToken(): string | null {
  const t = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '';
  return t && !t.startsWith('YOUR-') ? t : null;
}

/** Price ID for a course, from PADDLE_PRICE_<SLUG> (dashes → underscores).
    Language variants of a family share one price: if a variant has no env of
    its own, it falls back to the family's (e.g. catalan-a1-fr → PADDLE_PRICE_
    CATALAN_A1). The variant bought is recorded via course_slug in custom_data. */
export function priceIdFor(courseSlug: string): string | null {
  const read = (slug: string) => {
    const v = process.env[`PADDLE_PRICE_${slug.toUpperCase().replace(/-/g, '_')}`] ?? '';
    return v && !v.startsWith('YOUR-') ? v : null;
  };
  const fam = familyOf(courseSlug);
  return read(courseSlug) ?? (fam && fam !== courseSlug ? read(fam) : null);
}

export function isPaddleConfigured(): boolean {
  return paddleClientToken() !== null;
}
