import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { LOCALES, type Locale } from './i18n';

export const MEDIUM_COOKIE = 'vb-medium';

/* A returning visitor's last-seen language, remembered on the localized
   marketing pages (see SetMedium). This is a SOFT preference only — it seeds
   which language the catalog's course chooser starts on. It never decides which
   course renders: each language is its own course, so the variant slug does.
   Returns null when absent or not a known locale. */
export const preferredMedium = cache(async (): Promise<Locale | null> => {
  const v = (await cookies()).get(MEDIUM_COOKIE)?.value;
  return v && (LOCALES as readonly string[]).includes(v) ? (v as Locale) : null;
});
