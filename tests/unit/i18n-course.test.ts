import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { getCourse } from '@/lib/course';
import { extractCatalog, localizeCourse } from '@/lib/i18n-course';

describe('course i18n engine', () => {
  const course = getCourse();

  it('extracts a non-trivial English catalog', () => {
    const cat = extractCatalog(course);
    expect(Object.keys(cat).length).toBeGreaterThan(200);
    expect(cat['intro']).toBeTruthy();
    expect(cat['u2.title']).toBeTruthy();
  });

  it('localizing with the full English catalog is a lossless identity', () => {
    // proves the keys/get/set are consistent (no drift, no clobbering)
    const same = localizeCourse(course, extractCatalog(course));
    expect(same).toEqual(course);
  });

  it('applies only the keys provided; the rest fall back to English', () => {
    const cat = extractCatalog(course);
    const [k0, k1] = Object.keys(cat);
    const out = extractCatalog(localizeCourse(course, { [k0]: 'ZZZ' }));
    expect(out[k0]).toBe('ZZZ');
    expect(out[k1]).toBe(cat[k1]);
  });

  it('never touches the Catalan spine', () => {
    const out = localizeCourse(course, {});   // empty medium dict
    expect(out.glossary.map(r => `${r.ca}|${r.ipa}`)).toEqual(course.glossary.map(r => `${r.ca}|${r.ipa}`));
    // a gap exercise's Catalan answers are unchanged
    const gap = course.units.flatMap(u => u.blocks).find(b => b.kind === 'exercise' && b.ex.type === 'gap');
    const gapOut = out.units.flatMap(u => u.blocks).find(b => b.kind === 'exercise' && b.ex.type === 'gap');
    if (gap?.kind === 'exercise' && gapOut?.kind === 'exercise') {
      expect(JSON.stringify(gapOut.ex.items)).toContain((gap.ex.items[0] as { answers: string[] }).answers[0]);
    }
  });
});

describe.each(['es', 'fr', 'ru'])('%s translation catalog', medium => {
  const course = getCourse();
  const en = extractCatalog(course);
  const dict: Record<string, string> = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'i18n', `catalan-a1.${medium}.json`), 'utf8'),
  );
  const tags = (s: string) => (s.match(/<\s*[a-zA-Z0-9]+/g) ?? []).sort().join(',');
  const caCount = (s: string) => (s.match(/class="ca"/g) ?? []).length;

  it('has exactly the same keys as the English catalog', () => {
    expect(Object.keys(dict).sort()).toEqual(Object.keys(en).sort());
  });

  it('preserves HTML structure and Catalan (ca) spans in every value', () => {
    const tagBad = Object.keys(en).filter(k => tags(en[k]) !== tags(dict[k]));
    const caBad = Object.keys(en).filter(k => caCount(en[k]) !== caCount(dict[k]));
    expect(tagBad).toEqual([]);
    expect(caBad).toEqual([]);
  });

  it('renders a localized course (titles localized, Catalan spine intact)', () => {
    const out = localizeCourse(course, dict);
    expect(out.units[1].title).not.toBe(course.units[1].title);          // localized
    expect(out.glossary.map(r => r.ca)).toEqual(course.glossary.map(r => r.ca)); // spine
  });
});
