import type { MetadataRoute } from 'next';
import { courseFamilies } from '@/lib/courses';
import { PATHS, LOCALES, type PageKey } from '@/lib/i18n';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';
const abs = (p: string) => (p.startsWith('http') ? p : `${SITE_URL}${p}`);

/* hreflang alternates (absolute URLs + x-default) for a localized page type —
   emitted as <xhtml:link> children so the sitemap reinforces the same clusters
   as the on-page hreflang. */
function langs(page: PageKey): Record<string, string> {
  const map = PATHS[page] as Record<string, string | undefined>;
  const out: Record<string, string> = {};
  for (const l of LOCALES) { const h = map[l]; if (h) out[l] = abs(h); }
  out['x-default'] = abs(PATHS[page].en);
  return out;
}

/* Only public, indexable pages. Gated units/mock/glossary show a paywall
   (thin/duplicate), so they're left out; auth/admin/account are disallowed
   in robots. Non-English course variants are noindex (see course layout). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const homeL = langs('home'), courseL = langs('course'), pricingL = langs('pricing');
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1, alternates: { languages: homeL } },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8, alternates: { languages: pricingL } },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/refunds`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/cookies`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
  ];
  // English course (the en member of the course cluster) + its free sub-pages.
  for (const c of courseFamilies().map(f => f.variants[0])) {
    const b = `${SITE_URL}/courses/${c.slug}`;
    entries.push(
      { url: b, lastModified: now, changeFrequency: 'weekly', priority: 0.9, alternates: { languages: courseL } },
      { url: `${b}/ipa`, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${b}/exam`, changeFrequency: 'monthly', priority: 0.6 },
    );
    for (const u of c.freeUnits) entries.push({ url: `${b}/unit/${u}`, changeFrequency: 'monthly', priority: 0.7 });
  }
  // Localized marketing landing pages — each carries the full alternates set too.
  const home = PATHS.home as Record<string, string | undefined>;
  const course = PATHS.course as Record<string, string | undefined>;
  const pricing = PATHS.pricing as Record<string, string | undefined>;
  for (const l of LOCALES) {
    if (l === 'en' || !home[l] || !course[l]) continue;
    entries.push(
      { url: abs(home[l]!), lastModified: now, changeFrequency: 'weekly', priority: 0.9, alternates: { languages: homeL } },
      { url: abs(course[l]!), lastModified: now, changeFrequency: 'weekly', priority: 0.9, alternates: { languages: courseL } },
    );
    if (pricing[l]) entries.push({ url: abs(pricing[l]!), changeFrequency: 'monthly', priority: 0.7, alternates: { languages: pricingL } });
  }
  return entries;
}
