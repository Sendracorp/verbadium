import { describe, it, expect } from 'vitest';
import {
  COURSES, getCourseMeta, courseFamilies, mediumForSlug, familyOf, variantForMedium,
} from '@/lib/courses';

describe('course catalog', () => {
  it('exposes the Catalan A1 course (English variant keeps the bare slug)', () => {
    const meta = getCourseMeta('catalan-a1');
    expect(meta).toBeDefined();
    expect(meta!.slug).toBe('catalan-a1');
    expect(meta!.medium).toBe('en');
    expect(meta!.freeUnits).toContain(1);
    expect(meta!.stats).toMatchObject({ units: 12, exercises: 108, glossary: 275 });
  });

  it('returns undefined for an unknown or unavailable slug', () => {
    expect(getCourseMeta('klingon-c2')).toBeUndefined();
  });

  it('every catalog entry has the fields the UI and Paddle wiring need', () => {
    for (const c of COURSES) {
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
      expect(c.priceLabel).toBeTruthy();
      expect(c.freeUnits.length).toBeGreaterThan(0);
      expect(c.family).toBeTruthy();
      expect(c.audienceLanguage).toBeTruthy();
    }
  });
});

describe('language variants', () => {
  it('groups variants under one family, English first', () => {
    const fams = courseFamilies();
    const a1 = fams.find(f => f.family === 'catalan-a1');
    expect(a1).toBeDefined();
    expect(a1!.variants[0].medium).toBe('en');
    expect(a1!.variants.map(v => v.medium).sort()).toEqual(['de', 'en', 'es', 'fr', 'ru']);
  });

  it('non-English variants get a -<medium> slug and derive their medium from it', () => {
    expect(getCourseMeta('catalan-a1-fr')?.medium).toBe('fr');
    expect(mediumForSlug('catalan-a1-fr')).toBe('fr');
    expect(mediumForSlug('catalan-a1')).toBe('en');
    expect(familyOf('catalan-a1-de')).toBe('catalan-a1');
  });

  it('resolves the variant taught in a given medium (and none for ca)', () => {
    expect(variantForMedium('catalan-a1', 'es')?.slug).toBe('catalan-a1-es');
    expect(variantForMedium('catalan-a1', 'ca')).toBeUndefined();
  });
});
