import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getCourseMeta } from '@/lib/courses';

/* Paddle webhook — the only writer of the purchases table.
   Configure in Paddle: Developer Tools → Notifications → add a destination
   <site>/api/webhooks/paddle for `transaction.completed`,
   `adjustment.created` and `adjustment.updated`; the endpoint's secret key
   goes in PADDLE_WEBHOOK_SECRET. */

/* Paddle-Signature: `ts=<unix>;h1=<hex>` where h1 = HMAC-SHA256(secret, `${ts}:${rawBody}`). */
function validSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? '';
  if (!secret || secret.startsWith('YOUR-') || !header) return false;
  const parts = Object.fromEntries(header.split(';').map(p => p.split('=') as [string, string]));
  const ts = parts['ts'];
  const h1 = parts['h1'];
  if (!ts || !h1) return false;
  const digest = crypto.createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(h1, 'hex'));
  } catch { return false; }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get('paddle-signature'))) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    // Misconfiguration on our side — 500 so Paddle retries later.
    return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
  }

  const payload = JSON.parse(rawBody);
  const event: string = payload?.event_type ?? '';
  const data = payload?.data ?? {};

  if (event === 'transaction.completed') {
    const custom = data.custom_data ?? {};
    const userId = custom.user_id;
    const courseSlug = custom.course_slug;
    const transactionId = String(data.id ?? '');
    if (!userId || !getCourseMeta(courseSlug) || !transactionId) {
      // Not one of ours (e.g. a manual transaction) — acknowledge so Paddle stops retrying.
      console.warn('Paddle webhook: transaction.completed without usable custom_data', { transactionId });
      return NextResponse.json({ ok: true, ignored: true });
    }
    const totals = data.details?.totals ?? {};
    const amount = Number(totals.grand_total ?? totals.total ?? NaN);   // lowest denomination, as string
    // First-party campaign attribution captured at checkout (object or JSON string).
    let attribution: unknown = null;
    if (custom.attribution) {
      attribution = typeof custom.attribution === 'string'
        ? (() => { try { return JSON.parse(custom.attribution); } catch { return null; } })()
        : custom.attribution;
    }
    const { error } = await supabase.from('purchases').upsert({
      user_id: userId,
      course_slug: courseSlug,
      provider_order_id: transactionId,
      status: 'paid',
      amount_cents: Number.isFinite(amount) ? amount : null,
      currency: data.currency_code ?? null,
      attribution,
    }, { onConflict: 'provider_order_id' });
    if (error) {
      console.error('Paddle webhook: purchase upsert failed', error);
      return NextResponse.json({ error: 'Database write failed.' }, { status: 500 });
    }
  } else if (
    (event === 'adjustment.created' || event === 'adjustment.updated') &&
    data.action === 'refund' && data.status === 'approved'
  ) {
    const { error } = await supabase.from('purchases')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('provider_order_id', String(data.transaction_id ?? ''));
    if (error) {
      console.error('Paddle webhook: refund update failed', error);
      return NextResponse.json({ error: 'Database write failed.' }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
