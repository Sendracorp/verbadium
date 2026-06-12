/* Downloads native-speaker pronunciations for course vocabulary from the
   Lingua Libre project on Wikimedia Commons (CC BY-SA), and writes:
     public/audio/ca/<slug>.mp3       one file per recorded word/phrase
     lib/native-audio.json            normalized text → [files], + credits

   Run manually when course vocabulary changes:  node scripts/fetch-native-audio.mjs
   Pass --category-cache <file> to reuse a previously fetched category listing.

   Matching: a course string gets native audio when the whole string (or its
   leading-article-stripped form) has a recording, or when it splits on
   "," / " / " into parts that ALL have recordings (played in sequence).
   Sentences won't match — they keep the TTS fallback. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.join(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'ca');
const MANIFEST = path.join(ROOT, 'lib', 'native-audio.json');
const UA = { 'User-Agent': 'catalan-course-audio/1.0 (sendracorp@protonmail.com)' };

// ─────────────────────── collect course texts ───────────────────────

function stripTags(html) {
  return html
    .replace(/<span class="(?:pron|en|say)"[^>]*>[\s\S]*?<\/span>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
/* mirror of cleanSpeak() in lib/speech.ts + the runtime normalization */
function norm(s) {
  return s.replace(/\/[^/]*\//g, ' ').replace(/[«»…]/g, '')
    .replace(/\s+/g, ' ').trim().toLowerCase().replace(/[.!?]+$/, '').trim();
}
const stripArticle = s => s.replace(/^(els|les|el|la|un|una)\s+/, '').replace(/^l['’]\s*/, '').trim();

function collectTexts() {
  const src = fs.readFileSync(path.join(ROOT, 'course_source.html'), 'utf8');
  const texts = new Set();
  for (const re of [/<td class="ca">([\s\S]*?)<\/td>/g, /<span class="ca">([\s\S]*?)<\/span>/g]) {
    for (const m of src.matchAll(re)) {
      const t = norm(stripTags(m[1]));
      if (t) texts.add(t);
    }
  }
  return [...texts];
}

// ─────────────────────── Lingua Libre index ───────────────────────

async function fetchJson(url) {
  for (let i = 0; i < 8; i++) {
    const res = await fetch(url, { headers: UA });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { console.log('  rate limited, waiting 30 s…'); await sleep(30000); }
  }
  throw new Error('Commons API rate limit not clearing');
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchCategoryFiles() {
  const cacheArg = process.argv.indexOf('--category-cache');
  if (cacheArg !== -1) return JSON.parse(fs.readFileSync(process.argv[cacheArg + 1], 'utf8'));
  let titles = [], cont = null;
  do {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=' +
      encodeURIComponent('Category:Lingua Libre pronunciation-cat') +
      '&cmtype=file&cmlimit=500&format=json' + (cont ? '&cmcontinue=' + encodeURIComponent(cont) : '');
    const d = await fetchJson(url);
    titles.push(...d.query.categorymembers.map(m => m.title));
    cont = d.continue?.cmcontinue ?? null;
    process.stdout.write(`\r  category listing: ${titles.length} files`);
    await sleep(1500);
  } while (cont);
  console.log();
  return titles;
}

// ─────────────────────────── matching ───────────────────────────

function buildIndex(titles) {
  const idx = new Map();          // recorded word (lowercase) → [{title, user}]
  const userCount = new Map();
  for (const t of titles) {
    const m = t.match(/^File:LL-Q7026 \(cat\)-([^-]+)-(.+)\.wav$/);
    if (!m) continue;
    const [, user, word] = m;
    const k = word.toLowerCase();
    if (!idx.has(k)) idx.set(k, []);
    idx.get(k).push({ title: t, user });
    userCount.set(user, (userCount.get(user) ?? 0) + 1);
  }
  // prefer prolific recordists → consistent voice across the course
  for (const list of idx.values()) {
    list.sort((a, b) => (userCount.get(b.user) - userCount.get(a.user)) || a.user.localeCompare(b.user));
  }
  return idx;
}

function lookup(idx, text) {
  return idx.get(text) ?? idx.get(stripArticle(text)) ?? null;
}
function resolve(idx, text) {
  const whole = lookup(idx, text);
  if (whole) return [whole[0]];
  const parts = text.split(/\s*\/\s*|\s*,\s*/).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const hits = parts.map(p => lookup(idx, p));
  return hits.every(Boolean) ? hits.map(h => h[0]) : null;
}

// ─────────────────────────── download ───────────────────────────

/* Commons MP3 transcode: /transcoded/<h>/<hh>/<file>/<file>.mp3 where
   h = md5 of the underscored filename. Falls back to the original WAV-less
   path check failing loudly (every Lingua Libre wav gets a transcode). */
function commonsMp3Url(title) {
  const fn = title.replace(/^File:/, '').replace(/ /g, '_');
  const h = crypto.createHash('md5').update(fn).digest('hex');
  const enc = encodeURIComponent(fn);
  return `https://upload.wikimedia.org/wikipedia/commons/transcoded/${h[0]}/${h.slice(0, 2)}/${enc}/${enc}.mp3`;
}
function slugFor(title) {
  const word = title.match(/^File:LL-Q7026 \(cat\)-[^-]+-(.+)\.wav$/)[1];
  const ascii = word.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const h = crypto.createHash('md5').update(title).digest('hex').slice(0, 6);
  return `${ascii}-${h}.mp3`;
}

/* Own recordings (recordings/index.json: { "<exact course text>": "file.mp3" },
   files alongside it) take priority over Lingua Libre — record sentences and
   dialogue lines with a native speaker and re-run this script. */
function loadOwnRecordings() {
  const dir = path.join(ROOT, 'recordings');
  const indexFile = path.join(dir, 'index.json');
  if (!fs.existsSync(indexFile)) return {};
  const own = {};
  for (const [text, file] of Object.entries(JSON.parse(fs.readFileSync(indexFile, 'utf8')))) {
    const src = path.join(dir, file);
    if (!fs.existsSync(src)) throw new Error(`recordings/index.json points at missing file: ${file}`);
    const slug = 'own-' + file.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.copyFileSync(src, path.join(OUT_DIR, slug));
    own[norm(text)] = [`/audio/ca/${slug}`];
  }
  return own;
}

(async () => {
  const texts = collectTexts();
  console.log(`course texts to cover: ${texts.length}`);
  const own = loadOwnRecordings();
  if (Object.keys(own).length) console.log(`own recordings: ${Object.keys(own).length}`);
  const idx = buildIndex(await fetchCategoryFiles());
  console.log(`Lingua Libre Catalan recordings: ${idx.size} distinct words`);

  const entries = {};          // normalized text → [public paths]
  const files = new Map();     // title → slug (dedupe shared recordings)
  const credits = new Map();   // user → uses
  let covered = 0;
  for (const text of texts) {
    if (own[text]) { entries[text] = own[text]; covered++; continue; }
    const recs = resolve(idx, text);
    if (!recs) continue;
    covered++;
    entries[text] = recs.map(r => {
      if (!files.has(r.title)) files.set(r.title, slugFor(r.title));
      credits.set(r.user, (credits.get(r.user) ?? 0) + 1);
      return `/audio/ca/${files.get(r.title)}`;
    });
  }
  console.log(`covered by native recordings: ${covered}/${texts.length} (${files.size} audio files)`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let downloaded = 0, kept = 0;
  for (const [title, slug] of files) {
    const dest = path.join(OUT_DIR, slug);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { kept++; continue; }
    let res = null;
    for (let i = 0; i < 8; i++) {
      res = await fetch(commonsMp3Url(title), { headers: UA });
      if (res.status !== 429) break;
      process.stdout.write('\r  rate limited, waiting 30 s…   ');
      await sleep(30000);
    }
    if (!res?.ok) throw new Error(`download failed ${res?.status}: ${title}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    downloaded++;
    if (downloaded % 25 === 0) process.stdout.write(`\r  downloaded ${downloaded}…   `);
    await sleep(350);
  }
  console.log(`\nfiles: ${downloaded} downloaded, ${kept} already present`);

  // prune files no longer referenced
  const wanted = new Set([...files.values(),
    ...Object.values(own).map(p => p[0].replace('/audio/ca/', ''))]);
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (!wanted.has(f)) { fs.unlinkSync(path.join(OUT_DIR, f)); console.log('  pruned', f); }
  }

  // recording session script: everything still on TTS, one line per item
  const uncovered = texts.filter(t => !entries[t]).sort();
  fs.mkdirSync(path.join(ROOT, 'recordings'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'recordings', 'TODO.txt'),
    `# ${uncovered.length} course texts without native audio (fall back to TTS).\n` +
    '# Record these with a native speaker, list them in recordings/index.json\n' +
    '# as { "<text>": "<file.mp3>" }, then re-run scripts/fetch-native-audio.mjs.\n\n' +
    uncovered.join('\n') + '\n');
  console.log(`recording TODO list: ${uncovered.length} texts → recordings/TODO.txt`);

  fs.writeFileSync(MANIFEST, JSON.stringify({
    source: 'Lingua Libre (lingualibre.org) via Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    fetched: new Date().toISOString().slice(0, 10),
    credits: Object.fromEntries([...credits.entries()].sort((a, b) => b[1] - a[1])),
    entries,
  }, null, 1));
  console.log(`manifest: ${Object.keys(entries).length} entries → lib/native-audio.json`);
})();
