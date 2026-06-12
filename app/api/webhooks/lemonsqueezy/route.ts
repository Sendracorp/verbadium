import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getCourseMeta } from '@/lib/courses';

/* Lemon Squeezy webhook — the only writer of the purchases table.
   Configure in LS: Settings → Webhooks → <site>/api/webhooks/lemonsqueezy,
   events `order_created` + `order_refunded`, secret = LEMONSQUEEZY_WEBHOOK_SECRET. */

function validSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? '';
  if (!secret || secret.startsWith('YOUR-') || !signature) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'));
  } catch { return false; }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get('x-signature'))) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    // Misconfiguration on our side — 500 so Lemon Squeezy retries later.
    return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
  }

  const payload = JSON.parse(rawBody);
  const event: string = payload?.meta?.event_name ?? '';
  const custom = payload?.meta?.custom_data ?? {};
  const order = payload?.data;
  const orderId = String(order?.id ?? '');

  if (event === 'order_created') {
    const userId = custom.user_id;
    const courseSlug = custom.course_slug;
    if (!userId || !getCourseMeta(courseSlug) || !orderId) {
      // Not one of ours (e.g. a manual order) — acknowledge so LS stops retrying.
      console.warn('LS webhook: order_created without usable custom_data', { orderId });
      return NextResponse.json({ ok: true, ignored: true });
    }
    const { error } = await supabase.from('purchases').upsert({
      user_id: userId,
      course_slug: courseSlug,
      ls_order_id: orderId,
      status: 'paid',
      amount_cents: order?.attributes?.total ?? null,
      currency: order?.attributes?.currency ?? null,
    }, { onConflict: 'ls_order_id' });
    if (error) {
      console.error('LS webhook: purchase upsert failed', error);
      return NextResponse.json({ error: 'Database write failed.' }, { status: 500 });
    }
  } else if (event === 'order_refunded') {
    const { error } = await supabase.from('purchases')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('ls_order_id', orderId);
    if (error) {
      console.error('LS webhook: refund update failed', error);
      return NextResponse.json({ error: 'Database write failed.' }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
