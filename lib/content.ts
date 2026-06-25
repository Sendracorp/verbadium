import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { Course } from './types';
import type { Locale } from './i18n';
import { getCourse } from './course';
import { localizeCourse } from './i18n-course';
import { familyOf, mediumForSlug } from './courses';

// Content is shared across a family's language variants — keyed by family.
function familyCourse(family: string | undefined): Course | null {
  return family === 'catalan-a1' ? getCourse() : null;
}

function loadDict(family: string, medium: Locale): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', `${family}.${medium}.json`), 'utf8'));
  } catch { return {}; }   // no translation file yet → English fallback
}

const localized = new Map<string, Course | null>();

/* Parsed content for a course variant slug, in its teaching medium (derived
   from the slug — each language variant is its own course). English is the
   source, returned untouched; other mediums apply the translation overlay
   (LOCALIZATION.md §3), with missing keys falling back to English. */
export function getCourseContent(slug: string): Course | null {
  const family = familyOf(slug);
  if (!family) return null;
  const medium = mediumForSlug(slug);
  if (medium === 'en') return familyCourse(family);
  const key = `${family}:${medium}`;
  if (localized.has(key)) return localized.get(key)!;
  const base = familyCourse(family);
  const out = base ? localizeCourse(base, loadDict(family, medium)) : null;
  localized.set(key, out);
  return out;
}
