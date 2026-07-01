/* The course catalog. Client-safe: metadata only, no content or secrets.

   Each teaching LANGUAGE is its own purchasable course ("variant"), grouped by
   `family`. The same Catalan content + audio is taught; `medium` is the language
   it's explained in. Adding a language = adding a variant here (+ its i18n
   content overlay i18n/<family>.<medium>.json). All variants of a family share
   one Paddle price; the variant bought is recorded via course_slug. */

import type { Locale } from './i18n';

export interface CourseMeta {
  slug: string;
  family: string;              // groups the language variants of one course
  medium: Locale;              // language the course is taught/explained in
  audienceLanguage: string;    // English name of the speaker audience ("Spanish")
  language: string;            // subject language being learned ("Catalan")
  level: string;
  title: string;               // English display + fallback; localized copy comes from lib/i18n
  tagline: string;
  description: string;
  priceLabel: string;          // fallback label only; the live price comes from Paddle (lib/pricing.ts)
  freeUnits: number[];         // unit numbers available without purchase
  stats: { units: number; exercises: number; glossary: number };
  available: boolean;          // false = "coming soon" / not yet sellable
}

const A1 = {
  family: 'catalan-a1',
  language: 'Catalan',
  level: 'A1',
  title: 'Catalan from Scratch (A1)',
  tagline: 'A complete beginner’s course in Central Catalan — built to pass the official A1 exam.',
  description: '12 progressive units · 300+ words with full IPA · 108 interactive exercises · full mock A1 exam with timers · complete glossary (275 entries).',
  priceLabel: '€25',
  freeUnits: [1],
  stats: { units: 12, exercises: 108, glossary: 275 },
};

const A2 = {
  family: 'catalan-a2',
  language: 'Catalan',
  level: 'A2',
  title: 'Catalan: Next Steps (A2)',
  tagline: 'The A2 (bàsic) course — past tenses, pronouns and everyday functions, built to pass the official A2 exam.',
  description: '15 units · past tenses, weak & combined pronouns, future/conditional · 142 interactive exercises · full mock A2 exam · glossary with IPA.',
  priceLabel: '€25',
  freeUnits: [1],
  stats: { units: 15, exercises: 142, glossary: 140 },
};

// The teaching languages each course is sold in. English keeps the bare
// `<family>` slug (its original URL); others get a `-<medium>` suffix.
const VARIANTS: { medium: Locale; audienceLanguage: string }[] = [
  { medium: 'en', audienceLanguage: 'English' },
  { medium: 'es', audienceLanguage: 'Spanish' },
  { medium: 'fr', audienceLanguage: 'French' },
  { medium: 'ru', audienceLanguage: 'Russian' },
  { medium: 'de', audienceLanguage: 'German' },
];

function expand(base: typeof A1 | typeof A2, available: boolean): CourseMeta[] {
  return VARIANTS.map(({ medium, audienceLanguage }) => ({
    ...base,
    slug: medium === 'en' ? base.family : `${base.family}-${medium}`,
    medium,
    audienceLanguage,
    available,
  }));
}

// A2 is content-complete + engine-wired, but kept unavailable until its
// marketing copy is localized (dict.course.* is A1-specific), the content is
// translated to es/fr/ru/de, audio is generated, the Paddle price exists, and
// the Catalan spine passes native review. Flip to `true` to launch.
export const COURSES: CourseMeta[] = [...expand(A1, true), ...expand(A2, false)];

/** A sellable course variant by slug (only `available` ones). */
export function getCourseMeta(slug: string): CourseMeta | undefined {
  return COURSES.find(c => c.slug === slug && c.available);
}

/** Variant lookup that ignores `available` — for content/medium resolution. */
export function courseVariant(slug: string): CourseMeta | undefined {
  return COURSES.find(c => c.slug === slug);
}

/** Teaching medium for a slug (derived from the variant, never a cookie). */
export function mediumForSlug(slug: string): Locale {
  return courseVariant(slug)?.medium ?? 'en';
}

/** The family a slug belongs to, if any. */
export function familyOf(slug: string): string | undefined {
  return courseVariant(slug)?.family;
}

/** The sellable variant of a family taught in a given medium, if one exists.
    (Some marketing locales — e.g. ca — have no teaching variant.) */
export function variantForMedium(family: string, medium: Locale): CourseMeta | undefined {
  return COURSES.find(c => c.family === family && c.medium === medium && c.available);
}

// Course progression: which family follows which (for the "next step" CTA).
const NEXT_FAMILY: Record<string, string> = { 'catalan-a1': 'catalan-a2' };

/** The English meta of the course that follows `family`, if defined. Ignores
    `available` (returns the "coming soon" course too) so callers can decide
    whether to link or show a coming-soon label. */
export function nextCourse(family: string): CourseMeta | undefined {
  const next = NEXT_FAMILY[family];
  return next ? COURSES.find(c => c.family === next && c.medium === 'en') : undefined;
}

export interface CourseFamily { family: string; variants: CourseMeta[] }

/** Sellable variants grouped by family, in catalog order (English first). */
export function courseFamilies(): CourseFamily[] {
  const out: CourseFamily[] = [];
  for (const c of COURSES) {
    if (!c.available) continue;
    let g = out.find(x => x.family === c.family);
    if (!g) { g = { family: c.family, variants: [] }; out.push(g); }
    g.variants.push(c);
  }
  return out;
}
