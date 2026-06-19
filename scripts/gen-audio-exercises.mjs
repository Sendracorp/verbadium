/* One-off authoring helper: adds a `listen` (hear Catalan → write English) and
   a `dictation` (hear Catalan → write it) exercise to every unit, drawn from
   the curated glossary and filtered to phrases that already have audio. Skips a
   type a unit already has. Writes the exercises + listen answer keys straight
   into course_source.html. Re-runnable: it won't duplicate (skips units that
   already have both types).  node scripts/gen-audio-exercises.mjs */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'course_source.html');
const nat = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib/native-audio.json'), 'utf8')).entries;
const tts = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib/tts-audio.json'), 'utf8')).entries;

const stripTags = h => h.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nativeKey = t => t.replace(/\/[^/]*\//g, ' ').replace(/[«»]/g, '').replace(/…/g, '')
  .replace(/\s+/g, ' ').trim().toLowerCase().replace(/[.!?]+$/, '').trim();
const audio = ca => { const k = nativeKey(ca); return k in nat ? 'N' : (k in tts ? 'T' : null); };
const DICT_BAD = /[?¿!¡]/;                 // skip questions/exclamations for dictation

let src = fs.readFileSync(SRC, 'utf8');

// ── glossary (appendix table): ca | ipa | en | unit ──
const glos = [];
const tbl = src.slice(src.indexOf('<table class="glos">'));
for (const m of tbl.matchAll(/<tr><td class="ca">([\s\S]*?)<\/td><td class="pron">[\s\S]*?<\/td><td class="en">([\s\S]*?)<\/td><td>(\d+)<\/td><\/tr>/g)) {
  const ca = stripTags(m[1]), en = stripTags(m[2]), unit = +m[3];
  if (!/^[A-Za-zÀ-ÿ]/.test(ca)) continue;          // no grammar fragments ("-es")
  // skip multi-item lists, variants and parentheticals — ambiguous to write/grade
  if (/[,/(→=]/.test(ca) || / \/ /.test(en)) continue;
  if (ca.length < 2 || ca.length > 38) continue;
  if (!audio(ca)) continue;
  glos.push({ ca, en, unit, words: ca.split(/\s+/).length });
}

const SECTIONS = ['<!-- ===== UNIT 1', '<!-- ===== UNIT 2', '<!-- ===== UNIT 3', '<!-- ===== UNIT 4',
  '<!-- ===== UNIT 5', '<!-- ===== UNIT 6', '<!-- ===== UNIT 7', '<!-- ===== UNIT 8', '<!-- ===== UNIT 9',
  '<!-- ===== UNIT 10', '<!-- ===== UNIT 11', '<!-- ===== UNIT 12', '<!-- ===== EXAM PREPARATION'];

let added = 0;
const report = [];

for (let u = 12; u >= 1; u--) {                     // back-to-front: keep earlier indices stable
  const start = src.indexOf(SECTIONS[u - 1]);
  const end = src.indexOf(SECTIONS[u]);
  let block = src.slice(start, end);

  const hasListen = /<h4>\s*Listen\b(?![^<]*\bmatch\b)[^<]*\benglish\b/i.test(block);
  const hasDict = [...block.matchAll(/<h4>([^<]*)<\/h4>/g)].some(m =>
    /^\s*Listen\b/i.test(m[1]) && !/\bmatch\b/i.test(m[1]) && !/\benglish\b/i.test(m[1]));

  const want = [];
  if (!hasListen) want.push('listen');
  if (!hasDict) want.push('dictation');
  if (!want.length) continue;

  const pool = glos.filter(g => g.unit === u)
    .sort((a, b) => (audio(b.ca) === 'N') - (audio(a.ca) === 'N') || a.ca.length - b.ca.length);
  const maxM = Math.max(0, ...[...block.matchAll(/EX \d+\.(\d+)/g)].map(m => +m[1]));

  // allocate dictation first (short, statement-only words), then listen gets the rest
  const used = new Set();
  const take = (arr, n) => { const out = []; for (const g of arr) { if (out.length >= n) break; if (used.has(g.ca)) continue; used.add(g.ca); out.push(g); } return out; };
  const dictItems = want.includes('dictation')
    ? take(pool.filter(g => !DICT_BAD.test(g.ca) && g.words <= 3).sort((a, b) => a.ca.length - b.ca.length), 5) : [];
  const listenItems = want.includes('listen') ? take(pool, 5) : [];

  let m = maxM;
  const ex = [], keys = [];
  const emit = (kind, items) => {
    if (items.length < 3) { report.push(`U${u} SKIP ${kind} (only ${items.length} items)`); return; }
    m += 1; const id = `${u}.${m}`;
    if (kind === 'dictation') {
      ex.push(`  <div class="ex"><span class="label">EX ${id}</span><h4>Listen and write the Catalan you hear.</h4>\n  <ol class="q">${items.map(g => `<li>${esc(g.ca)}</li>`).join('')}</ol></div>`);
      report.push(`U${u} ${id} dictation: ${items.map(g => g.ca).join(' · ')}`);
    } else {
      ex.push(`  <div class="ex"><span class="label">EX ${id}</span><h4>Listen and write what you hear, in English.</h4>\n  <ol class="q">${items.map(g => `<li>${esc(g.ca)}</li>`).join('')}</ol></div>`);
      // accept the glossary's sense-variants ("to look at, watch" → either)
      const enVariants = g => g.en.split(/\s*[;,]\s*/).map(s => s.trim()).filter(Boolean).join(' / ');
      keys.push(`<span class="ak">${id}</span> ${items.map((g, i) => `${i + 1}) ${enVariants(g)}`).join(' ')}.`);
      report.push(`U${u} ${id} listen: ${items.map(g => `${g.ca}=${g.en}`).join(' | ')}`);
    }
    added++;
  };
  if (want.includes('dictation')) emit('dictation', dictItems);
  if (want.includes('listen')) emit('listen', listenItems);

  // insert exercises before the unit's closing </div>
  const lastClose = block.lastIndexOf('</div>');
  block = block.slice(0, lastClose) + '\n' + ex.join('\n\n') + '\n' + block.slice(lastClose);
  src = src.slice(0, start) + block + src.slice(end);

  // insert listen keys into this unit's ans-block
  if (keys.length) {
    const akStart = src.indexOf(`<h3>Unit ${u}</h3>`);
    const akClose = src.indexOf('</div>', akStart);
    src = src.slice(0, akClose) + ' ' + keys.join(' ') + src.slice(akClose);
  }
}

fs.writeFileSync(SRC, src);
report.reverse().forEach(r => console.log(r));
console.log(`\nADDED ${added} audio exercises.`);
