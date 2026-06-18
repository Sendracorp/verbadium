import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nativeKey } from '@/lib/native-audio-key';
import tts from '@/lib/tts-audio.json';
import native from '@/lib/native-audio.json';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const entries = tts.entries as Record<string, string[]>;

describe('tts-audio manifest integrity', () => {
  it('has entries from the Google voice', () => {
    expect(Object.keys(entries).length).toBeGreaterThan(100);
    expect(tts.voice).toBe('ca-ES-Standard-B');
  });

  it('every key is normalized (so nativeKey() hits it at runtime)', () => {
    for (const key of Object.keys(entries)) {
      expect(key, `tts key "${key}" is not normalized`).toBe(nativeKey(key));
    }
  });

  it('every referenced tts-*.mp3 exists under public/', () => {
    const missing: string[] = [];
    for (const files of Object.values(entries)) {
      for (const p of files) {
        expect(p.startsWith('/audio/ca/tts-')).toBe(true);
        if (!existsSync(ROOT + 'public' + p)) missing.push(p);
      }
    }
    expect(missing, `missing tts files: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('never shadows a real native recording (native wins at runtime)', () => {
    const nativeKeys = new Set(Object.keys(native.entries as Record<string, string[]>));
    const overlap = Object.keys(entries).filter(k => nativeKeys.has(k));
    expect(overlap, `tts overlaps native for: ${overlap.slice(0, 5).join(', ')}`).toEqual([]);
  });
});
