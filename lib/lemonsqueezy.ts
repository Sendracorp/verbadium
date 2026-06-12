import 'server-only';

const API = 'https://api.lemonsqueezy.com/v1';

export function isLemonSqueezyConfigured(): boolean {
  const k = process.env.LEMONSQUEEZY_API_KEY ?? '';
  const s = process.env.LEMONSQUEEZY_STORE_ID ?? '';
  return !!k && !k.startsWith('YOUR-') && !!s && !s.startsWith('YOUR-');
}

/** Variant ID for a course, from LEMONSQUEEZY_VARIANT_<SLUG> (dashes → underscores). */
export function variantIdFor(courseSlug: string): string | null {
  const v = process.env[`LEMONSQUEEZY_VARIANT_${courseSlug.toUpperCase().replace(/-/g, '_')}`] ?? '';
  return v && !v.startsWith('YOUR-') ? v : null;
}

/** Creates a hosted checkout pre-filled with the buyer's email; user_id and
    course_slug travel in custom_data and come back on the webhook. */
export async function createCheckout(opts: {
  courseSlug: string;
  userId: string;
  email: string;
}): Promise<{ url: string } | { error: string }> {
  if (!isLemonSqueezyConfigured()) return { error: 'Payments are not configured yet on this deployment.' };
  const variantId = variantIdFor(opts.courseSlug);
  if (!variantId) return { error: 'This course has no price configured yet.' };

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${API}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: opts.email,
            custom: { user_id: opts.userId, course_slug: opts.courseSlug },
          },
          product_options: {
            redirect_url: `${site}/courses/${opts.courseSlug}?purchased=1`,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      },
    }),
  });
  if (!res.ok) {
    console.error('Lemon Squeezy checkout failed:', res.status, await res.text());
    return { error: 'Could not start checkout. Please try again in a moment.' };
  }
  const body = await res.json();
  const url = body?.data?.attributes?.url;
  return url ? { url } : { error: 'Checkout created but no URL returned.' };
}
