import { describe, it, expect } from 'vitest';
import { COURSES, getCourseMeta } from '@/lib/courses';

describe('course catalog', () => {
  it('exposes the Catalan A1 course', () => {
    const meta = getCourseMeta('catalan-a1');
    expect(meta).toBeDefined();
    expect(meta!.slug).toBe('catalan-a1');
    expect(meta!.freeUnits).toContain(1);
    expect(meta!.stats).toMatchObject({ units: 12, exercises: 83, glossary: 275 });
  });

  it('returns undefined for an unknown or unavailable slug', () => {
    expect(getCourseMeta('klingon-c2')).toBeUndefined();
  });

  it('every catalog entry has the fields the UI and Paddle wiring need', () => {
    for (const c of COURSES) {
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
      expect(c.priceLabel).toBeTruthy();
      expect(c.freeUnits.length).toBeGreaterThan(0);
    }
  });
});
