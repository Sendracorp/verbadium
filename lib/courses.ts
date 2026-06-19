/* The course catalog. Client-safe: metadata only, no content or secrets.
   Adding a course = adding an entry here (+ content source + a
   PADDLE_PRICE_<SLUG> env var for its Paddle price). */

export interface CourseMeta {
  slug: string;
  language: string;
  level: string;
  title: string;
  tagline: string;
  description: string;
  priceLabel: string;          // fallback label only; the live price comes from Paddle (lib/pricing.ts)
  freeUnits: number[];         // unit numbers available without purchase
  stats: { units: number; exercises: number; glossary: number };
  available: boolean;          // false = "coming soon" card
}

export const COURSES: CourseMeta[] = [
  {
    slug: 'catalan-a1',
    language: 'Catalan',
    level: 'A1',
    title: 'Catalan from Scratch (A1)',
    tagline: 'A complete beginner’s course in Central Catalan for English-speaking adults — built to pass the official A1 exam.',
    description: '12 progressive units · 300+ words with full IPA · 108 interactive exercises · full mock A1 exam with timers · complete glossary (275 entries).',
    priceLabel: '€70',
    freeUnits: [1],
    stats: { units: 12, exercises: 108, glossary: 275 },
    available: true,
  },
];

export function getCourseMeta(slug: string): CourseMeta | undefined {
  return COURSES.find(c => c.slug === slug && c.available);
}
