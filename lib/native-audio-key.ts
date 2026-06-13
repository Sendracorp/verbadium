/* Normalize a Catalan string to its native-audio manifest key. Pure and
   browser-free, so it is shared by the runtime player (lib/speech.ts), the
   build-time matcher (scripts/fetch-native-audio.mjs) and unit tests —
   keeping all three in lockstep. */

export function cleanSpeak(text: string): string {
  return text.replace(/\/[^/]*\//g, ' ').replace(/[«»]/g, '').replace(/…/g, '').replace(/\s+/g, ' ').trim();
}

/** Lowercased, IPA/quote-stripped, trailing-punctuation-trimmed lookup key. */
export function nativeKey(text: string): string {
  return cleanSpeak(text).toLowerCase().replace(/[.!?]+$/, '').trim();
}
