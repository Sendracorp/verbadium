import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nativeKey } from '@/lib/native-audio-key';
import manifest from '@/lib/native-audio.json';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const entries = manifest.entries as Record<string, string[]>;

describe('nativeKey normalization', () => {
  it('lowercases and trims trailing punctuation', () => {
    expect(nativeKey('Formatge.')).toBe('formatge');
    expect(nativeKey('Hola!')).toBe('hola');
  });
  it('strips IPA, guillemets and ellipsis', () => {
    expect(nativeKey('aigua /ˈaj.ɣwə/')).toBe('aigua');
    expect(nativeKey('«bon dia»…')).toBe('bon dia');
  });
  it('is idempotent', () => {
    expect(nativeKey(nativeKey('Bon Dia!'))).toBe(nativeKey('Bon Dia!'));
  });
});

describe('native-audio manifest integrity', () => {
  it('has entries and CC BY-SA credits', () => {
    expect(Object.keys(entries).length).toBeGreaterThan(100);
    expect(manifest.license).toMatch(/CC BY-SA/);
    expect(Object.keys(manifest.credits).length).toBeGreaterThan(0);
  });

  it('every entry key is already normalized (will be hit by nativeKey at runtime)', () => {
    for (const key of Object.keys(entries)) {
      expect(key, `manifest key "${key}" is not normalized`).toBe(nativeKey(key));
    }
  });

  it('every referenced MP3 exists on disk under public/', () => {
    const missing: string[] = [];
    for (const files of Object.values(entries)) {
      for (const p of files) {
        expect(p.startsWith('/audio/ca/')).toBe(true);
        if (!existsSync(ROOT + 'public' + p)) missing.push(p);
      }
    }
    expect(missing, `missing audio files: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('resolves a known single word and a chained multi-word entry', () => {
    expect(entries[nativeKey('formatge')]).toHaveLength(1);
    expect(entries[nativeKey('abril, maig, juny')]?.length).toBeGreaterThan(1);
  });
});
