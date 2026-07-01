import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { Course } from './types';
import type { Locale } from './i18n';
import { getCourse, getCourseA2 } from './course';
import { localizeCourse } from './i18n-course';
import { familyOf, mediumForSlug, priorFamily, courseVariant } from './courses';
import type { GlossaryRow } from './types';

// Content is shared across a family's language variants — keyed by family.
function familyCourse(family: string | undefined): Course | null {
  return family === 'catalan-a1' ? getCourse()
    : family === 'catalan-a2' ? getCourseA2()
    : null;
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

/* The glossary to SHOW for a course: its own words plus every earlier course's
   in the same track (so an A2 learner can look up A1 vocab too), each tagged
   with its course level and deduped by Catalan word (earliest introduction
   wins). Courses with no prior (A1) return their plain glossary unchanged.
   Prior courses are read in the SAME teaching medium as `slug`. */
export function getDisplayGlossary(slug: string): GlossaryRow[] {
  const own = getCourseContent(slug);
  if (!own) return [];
  const family = familyOf(slug);
  const medium = mediumForSlug(slug);

  // earliest-first chain of families: [ …priors…, thisFamily ]
  const chain: string[] = [];
  for (let f = family; f; f = priorFamily(f)) chain.unshift(f);
  if (chain.length < 2) return own.glossary;   // A1 (no prior) — unchanged

  const seen = new Set<string>();
  const merged: GlossaryRow[] = [];
  for (const f of chain) {
    const s = f === family ? slug : (medium === 'en' ? f : `${f}-${medium}`);
    const rows = getCourseContent(s)?.glossary ?? [];
    const level = courseVariant(s)?.level ?? '';
    for (const r of rows) {
      const k = r.ca.trim().toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push({ ...r, level });
    }
  }
  return merged;
}
