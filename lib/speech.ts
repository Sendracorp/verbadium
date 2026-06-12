/* Audio helpers — client-only. Native-speaker recordings first (Lingua Libre
   via Wikimedia Commons, fetched by scripts/fetch-native-audio.mjs into
   /public/audio/ca + lib/native-audio.json), Web Speech TTS as the fallback
   for sentences and dialogue lines. TTS prefers a ca-ES voice, handles the
   async voice list, and shows a one-time dismissible Forvo notice if no
   Catalan voice exists on the device. */
import { sget, sset } from './progress';
import nativeAudio from './native-audio.json';

const NATIVE: Record<string, string[]> = nativeAudio.entries;

let caVoice: SpeechSynthesisVoice | null = null;
let wired = false;

function pickVoice(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const vs = speechSynthesis.getVoices();
  caVoice = null;
  for (const v of vs) {
    const l = (v.lang || '').toLowerCase().replace('_', '-');
    if (l === 'ca-es') { caVoice = v; break; }
    if (l.slice(0, 2) === 'ca' && !caVoice) caVoice = v;
  }
}
function ensureWired(): void {
  if (wired || typeof window === 'undefined' || !window.speechSynthesis) return;
  wired = true;
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

function ttsNotice(): void {
  if (sget('ttsNoticeDismissed', false) || document.getElementById('ttsNotice')) return;
  const n = document.createElement('div');
  n.className = 'tts-notice';
  n.id = 'ttsNotice';
  n.innerHTML = '<span>No Catalan voice was found on this device, so some audio may sound wrong. ' +
    'Single words use native recordings; you can hear more on ' +
    '<a href="https://forvo.com/languages/ca/" target="_blank" rel="noopener">Forvo</a>.</span>' +
    '<button type="button">OK</button>';
  n.querySelector('button')!.addEventListener('click', () => {
    sset('ttsNoticeDismissed', true);
    n.remove();
  });
  document.body.appendChild(n);
}

export function cleanSpeak(text: string): string {
  return text.replace(/\/[^/]*\//g, ' ').replace(/[«»]/g, '').replace(/…/g, '').replace(/\s+/g, ' ').trim();
}

/* normalization must mirror scripts/fetch-native-audio.mjs */
function nativeKey(text: string): string {
  return cleanSpeak(text).toLowerCase().replace(/[.!?]+$/, '').trim();
}

let currentAudio: HTMLAudioElement | null = null;
let chainToken = 0;

/* Plays the recordings of a multi-part entry ("abril, maig, juny") back to
   back. Any playback error falls through to onend — never a dead button. */
function playNative(files: string[], onend?: () => void): void {
  const token = ++chainToken;
  const next = (i: number) => {
    if (token !== chainToken || i >= files.length) { onend?.(); return; }
    const a = new Audio(files[i]);
    currentAudio = a;
    a.onended = () => setTimeout(() => next(i + 1), i + 1 < files.length ? 250 : 0);
    a.onerror = () => next(i + 1);
    void a.play().catch(() => { onend?.(); });
  };
  next(0);
}

/** What the last speak() used — read by the QA suite. */
declare global { interface Window { __audioMode?: 'native' | 'tts' } }

export function speak(text: string, onend?: () => void, rate = 0.95): void {
  if (typeof window === 'undefined') { onend?.(); return; }
  const files = NATIVE[nativeKey(text)];
  if (files?.length) {
    window.__audioMode = 'native';
    stopSpeak();
    playNative(files, onend);
    return;
  }
  window.__audioMode = 'tts';
  if (!window.speechSynthesis) { onend?.(); return; }
  ensureWired();
  if (!caVoice) pickVoice();
  if (!caVoice) ttsNotice();
  const u = new SpeechSynthesisUtterance(cleanSpeak(text));
  u.lang = 'ca-ES';
  if (caVoice) u.voice = caVoice;
  u.rate = rate;
  if (onend) { u.onend = onend; u.onerror = onend; }
  speechSynthesis.speak(u);
}

export function stopSpeak(): void {
  if (typeof window === 'undefined') return;
  chainToken++;                       // cancels any pending native chain
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
}
