import 'server-only';
import { cookies } from 'next/headers';
import { LOCALES, type Locale } from './i18n';

export const MEDIUM_COOKIE = 'vb-medium';

/* Teaching mediums actually translated enough to OFFER per course. A locale is
   added here only once its i18n/<slug>.<locale>.json is complete — untranslated
   keys fall back to English, so a half-done medium must NOT be listed (it would
   render a mostly-English "Spanish" course). English is always available. */
export const AVAILABLE_MEDIUMS: Record<string, Locale[]> = {
  'catalan-a1': ['en'],
};

export function availableMediums(slug: string): Locale[] {
  return AVAILABLE_MEDIUMS[slug] ?? ['en'];
}

/** The learner's chosen teaching medium for a course (cookie), gated to the
    mediums that are actually available; defaults to English. */
export async function getMedium(slug: string): Promise<Locale> {
  const v = (await cookies()).get(MEDIUM_COOKIE)?.value;
  const avail = availableMediums(slug);
  return v && (LOCALES as readonly string[]).includes(v) && avail.includes(v as Locale) ? (v as Locale) : 'en';
}
