/* Pre-generates static MP3s for the course texts that have no native-speaker
   recording (sentences + dialogue lines that otherwise fall back to browser
   Web Speech TTS, which is wrong/absent on many devices). Uses Google Cloud
   Text-to-Speech (the only Catalan voice Google offers is ca-ES-Standard-B);
   dialogue speakers are pitch-shifted so two-person exchanges sound distinct.

   Writes:
     public/audio/ca/tts-<hash>.mp3   one file per synthesized text
     lib/tts-audio.json               normalized text → [file], merged at
                                      runtime UNDER native-audio.json (a real
                                      recording always wins).

   Run after scripts/fetch-native-audio.mjs (so already-covered vocab is
   skipped):  GOOGLE_TTS_API_KEY=… node scripts/generate-tts.mjs
   The key is read from .env.local; it is only used here, never shipped. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.join(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'course_source.html');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'ca');
const TTS_MANIFEST = path.join(ROOT, 'lib', 'tts-audio.json');
const NATIVE_MANIFEST = path.join(ROOT, 'lib', 'native-audio.json');

const VOICE = 'ca-ES-Standard-B';            // Google's only Catalan voice
const LANG = 'ca-ES';
const RATE = 0.95;                            // matches speak()'s default rate
const SPEAKER_PITCH = [0, -4.5, 3, -8];       // semitone per distinct dialogue speaker

try { process.loadEnvFile(path.join(ROOT, '.env.local')); } catch { /* ok */ }
const KEY = process.env.GOOGLE_TTS_API_KEY;
if (!KEY) { console.error('Missing GOOGLE_TTS_API_KEY (put it in .env.local).'); process.exit(1); }

// ── normalization: must stay in lockstep with lib/native-audio-key.ts ──
const cleanSpeak = t => t.replace(/\/[^/]*\//g, ' ').replace(/[«»]/g, '').replace(/…/g, '').replace(/\s+/g, ' ').trim();
const nativeKey = t => cleanSpeak(t).toLowerCase().replace(/[.!?]+$/, '').trim();

/* strip helper spans (pron/en/say/spk) wholesale, then all tags + entities */
function plain(html) {
  return html
    .replace(/<span class="(?:pron|en|say|spk)"[^>]*>[\s\S]*?<\/span>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&rsquo;|&#8217;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// ── collect every speakable text, mirroring components/SpeechScope.tsx ──
function collect() {
  const src = fs.readFileSync(SRC, 'utf8');
  const out = new Map();                       // key → { text, pitch }
  const add = (raw, pitch) => {
    const text = cleanSpeak(plain(raw));
    if (!text) return;
    const key = nativeKey(text);
    if (key && !out.has(key)) out.set(key, { text, pitch });
  };

  // vocabulary: td.ca / span.ca  (pitch 0)
  for (const m of src.matchAll(/<(td|span)[^>]*class="ca"[^>]*>([\s\S]*?)<\/\1>/g)) add(m[2], 0);

  // dialogue: each non-gloss <p>, voiced by its speaker's pitch slot
  for (const dlg of src.matchAll(/<div class="dialogue">([\s\S]*?)<\/div>/g)) {
    const speakers = new Map();                 // speaker name → pitch slot, per dialogue
    for (const p of dlg[1].matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)) {
      if (/class="[^"]*\bgloss\b/.test(p[1])) continue;
      const spk = (p[2].match(/<span class="spk">([^<]*)<\/span>/) || [])[1]?.trim() || '';
      if (!speakers.has(spk)) speakers.set(spk, SPEAKER_PITCH[speakers.size % SPEAKER_PITCH.length]);
      add(p[2], speakers.get(spk));
    }
  }
  return out;
}

async function synth(text, pitch) {
  const body = {
    input: { text },
    voice: { languageCode: LANG, name: VOICE },
    audioConfig: { audioEncoding: 'MP3', speakingRate: RATE, pitch },
  };
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) return Buffer.from((await res.json()).audioContent, 'base64');
    if (res.status === 429 || res.status >= 500) { await new Promise(r => setTimeout(r, 2000 * (i + 1))); continue; }
    throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  throw new Error('TTS rate limit not clearing');
}

(async () => {
  const native = JSON.parse(fs.readFileSync(NATIVE_MANIFEST, 'utf8')).entries;
  const targets = collect();
  // keep real recordings — only synthesize what native audio doesn't cover
  for (const k of Object.keys(native)) targets.delete(k);
  console.log(`texts needing TTS: ${targets.size}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const entries = {};
  const wanted = new Set();
  let made = 0, cached = 0;
  for (const [key, { text, pitch }] of targets) {
    const file = `tts-${crypto.createHash('sha1').update(`${key}|${pitch}`).digest('hex').slice(0, 10)}.mp3`;
    const dest = path.join(OUT_DIR, file);
    wanted.add(file);
    entries[key] = [`/audio/ca/${file}`];
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { cached++; continue; }
    fs.writeFileSync(dest, await synth(text, pitch));
    made++;
    if (made % 20 === 0) process.stdout.write(`\r  synthesized ${made}…   `);
    await new Promise(r => setTimeout(r, 60));
  }
  console.log(`\nfiles: ${made} synthesized, ${cached} cached`);

  // prune stale tts-*.mp3 no longer referenced
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.startsWith('tts-') && !wanted.has(f)) { fs.unlinkSync(path.join(OUT_DIR, f)); console.log('  pruned', f); }
  }

  const sorted = Object.fromEntries(Object.keys(entries).sort().map(k => [k, entries[k]]));
  fs.writeFileSync(TTS_MANIFEST, JSON.stringify({
    source: 'Google Cloud Text-to-Speech',
    voice: VOICE,
    note: 'Synthesized fallback for texts without a native recording; native-audio.json takes priority at runtime.',
    generated: new Date().toISOString().slice(0, 10),
    entries: sorted,
  }, null, 1));
  console.log(`manifest: ${Object.keys(sorted).length} entries → lib/tts-audio.json`);
})();
