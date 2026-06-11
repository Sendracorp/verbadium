/* Web Speech helpers — client-only. Prefers a ca-ES voice, handles the async
   voice list, and shows a one-time dismissible Forvo notice if no Catalan
   voice exists on the device. */
import { sget, sset } from './progress';

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
  n.innerHTML = '<span>No Catalan voice was found on this device, so audio may sound wrong. ' +
    'You can hear native recordings of every word on ' +
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

export function speak(text: string, onend?: () => void, rate = 0.95): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) { onend?.(); return; }
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
  if (typeof window !== 'undefined' && window.speechSynthesis) speechSynthesis.cancel();
}
