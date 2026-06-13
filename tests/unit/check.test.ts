import { describe, it, expect } from 'vitest';
import { checkText, norm, deaccent, normSentence, joinTokens } from '@/lib/check';

describe('checkText — default (text) marking', () => {
  it('marks an exact match ok, case- and punctuation-insensitive', () => {
    expect(checkText('Hola!', 'hola')).toBe('ok');
    expect(checkText('  EM dic  ', 'em dic')).toBe('ok');
  });

  it('marks a right-but-unaccented answer as almost', () => {
    expect(checkText('cafe', 'cafè')).toBe('almost');
    expect(checkText('són', 'son')).toBe('almost'); // extra accent vs key, same letters
  });

  it('marks a genuinely wrong answer as bad', () => {
    expect(checkText('xxx', 'hola')).toBe('bad');
  });

  it('accepts both the parenthetical and bare forms of an answer', () => {
    expect(checkText('a prop de', 'a prop (de)')).toBe('ok');
    expect(checkText('a prop', 'a prop (de)')).toBe('ok');
  });
});

describe('checkText — IPA mode', () => {
  it('ignores slashes, stress marks and spaces', () => {
    expect(checkText('[ˈuðə]', 'uðə', { ipa: true })).toBe('bad'); // brackets aren't stripped
    expect(checkText('/ˈu.ðə/', 'uðə', { ipa: true })).toBe('ok');
    expect(checkText('uðə', '/ˈu.ðə/', { ipa: true })).toBe('ok');
  });

  it('is strict about the phonemes themselves', () => {
    expect(checkText('uda', 'uðə', { ipa: true })).toBe('bad');
  });
});

describe('checkText — CAPS (stressed-syllable) mode', () => {
  it('ok when the stressed syllable is capitalised correctly', () => {
    expect(checkText('aiGUA', 'aiGUA', { caps: true })).toBe('ok');
  });
  it('almost when the word is right but no caps marked', () => {
    expect(checkText('aigua', 'aiGUA', { caps: true })).toBe('almost');
  });
  it('bad when the word itself is wrong', () => {
    expect(checkText('caFE', 'aiGUA', { caps: true })).toBe('bad');
  });
});

describe('normalization helpers', () => {
  it('norm lowercases, unifies apostrophes and strips punctuation', () => {
    expect(norm('L’adreça,')).toBe("l'adreça");
  });
  it('deaccent removes diacritics', () => {
    expect(deaccent('cafè')).toBe('cafe');
    expect(deaccent('València')).toBe('valencia');
  });
});

describe('reorder helpers', () => {
  it('normSentence is parenthesis- and trailing-punctuation-tolerant', () => {
    expect(normSentence('Em dic Marc.')).toBe(normSentence('em dic marc'));
    expect(normSentence('(El) llibre')).toBe(normSentence('el llibre'));
  });
  it('joinTokens spaces words but hugs punctuation', () => {
    expect(joinTokens(['Em', 'dic', 'Marc', '.'])).toBe('Em dic Marc.');
    expect(joinTokens(['Com', 'estàs', '?'])).toBe('Com estàs?');
  });
});
