/**
 * Build-time parser for course_source.html — the single source of truth.
 * Runs on the server (Next.js build / SSG). Throws if the fidelity counts
 * drift: 12 units, 108 exercises, 275 glossary rows, 15 checklist items —
 * so `next build` fails loudly instead of shipping lost content.
 */
import fs from 'fs';
import path from 'path';
import type {
  Course, Exercise, ExerciseType, GapItem, ListenItem, MatchItem, MockData, Unit, UnitBlock, WriteItem,
} from './types';

function fail(msg: string): never { throw new Error('COURSE PARSE FAILED: ' + msg); }
function assert(cond: unknown, msg: string): asserts cond { if (!cond) fail(msg); }

// ---------------------------------------------------------------- helpers

interface Block { tag: string; cls: string; outer: string; inner: string }

function matchTag(html: string, openStart: number): { tag: string; end: number } {
  const m = /^<([a-zA-Z][a-zA-Z0-9]*)/.exec(html.slice(openStart));
  assert(m, 'matchTag: no tag at ' + openStart);
  const tag = m[1];
  const re = new RegExp('<' + tag + '(?=[\\s>])|</' + tag + '>', 'gi');
  re.lastIndex = openStart;
  let depth = 0, mm: RegExpExecArray | null;
  while ((mm = re.exec(html))) {
    if (mm[0][1] === '/') { depth--; if (depth === 0) return { tag, end: mm.index + mm[0].length }; }
    else depth++;
  }
  fail('matchTag: unbalanced <' + tag + '> at ' + openStart);
}

function topLevel(html: string): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) break;
    if (html.startsWith('<!--', lt)) { i = html.indexOf('-->', lt) + 3; continue; }
    if (!/^<[a-zA-Z]/.test(html.slice(lt, lt + 2))) { i = lt + 1; continue; }
    const { tag, end } = matchTag(html, lt);
    const outer = html.slice(lt, end);
    const openEnd = html.indexOf('>', lt) + 1;
    const inner = html.slice(openEnd, end - (tag.length + 3));
    const attrM = html.slice(lt, openEnd).match(/class="([^"]*)"/);
    blocks.push({ tag: tag.toLowerCase(), cls: attrM ? attrM[1] : '', outer, inner });
    i = end;
  }
  return blocks;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
function extBlank(html: string): string {
  return html.replace(/<a href="http/g, '<a target="_blank" rel="noopener" href="http');
}

// -------------------------------------------------- exercise classification

const EX_TYPES: Record<string, ExerciseType> = {
  '1.1': 'write', '1.2': 'write', '1.3': 'write', '1.4': 'tf', '1.5': 'match', '1.6': 'model',
  '2.1': 'gap', '2.2': 'match', '2.3': 'model', '2.4': 'reorder', '2.5': 'model', '2.6': 'write', '2.7': 'write', '2.8': 'free',
  '3.1': 'gap', '3.2': 'write', '3.3': 'gap', '3.4': 'write', '3.5': 'model', '3.6': 'gap', '3.7': 'gap',
  '4.1': 'write', '4.2': 'gap', '4.3': 'gap', '4.4': 'model', '4.5': 'gap', '4.6': 'model', '4.7': 'free',
  '5.1': 'gap', '5.2': 'gap', '5.3': 'model', '5.4': 'paradigm', '5.5': 'model', '5.6': 'model', '5.7': 'model',
  '6.1': 'gap', '6.2': 'gap', '6.3': 'gap', '6.4': 'write', '6.5': 'model', '6.6': 'model', '6.7': 'free',
  '7.1': 'write', '7.2': 'gap', '7.3': 'write', '7.4': 'reorder', '7.5': 'model', '7.6': 'model', '7.7': 'free',
  '8.1': 'gap', '8.2': 'model', '8.3': 'write', '8.4': 'choice', '8.5': 'gap', '8.6': 'model', '8.7': 'free',
  '9.1': 'gap', '9.2': 'gap', '9.3': 'gap', '9.4': 'model', '9.5': 'model', '9.6': 'model', '9.7': 'write',
  '10.1': 'gap', '10.2': 'gap', '10.3': 'model', '10.4': 'model', '10.5': 'model', '10.6': 'write', '10.7': 'free',
  '11.1': 'gap', '11.2': 'write', '11.3': 'gap', '11.4': 'model', '11.5': 'model', '11.6': 'write', '11.7': 'free',
  '12.1': 'model', '12.2': 'gap', '12.3': 'free', '12.4': 'free', '12.5': 'personal', '12.6': 'free',
};
const ORAL_EX = new Set(['6.7', '8.7', '12.6']);
const IPA_INPUT_EX = new Set(['1.1']);
const CAPS_EX = new Set(['1.3']);

// explicit overrides where mechanical parsing of the key is ambiguous
const ANSWER_OVERRIDES: Record<string, string[][]> = {
  '6.2': [['el meu'], ['la meva'], ['els meus'], ['les meves']],
  '6.3': [['el teu'], ['la nostra'], ['els seus'], ['les seves']],
};

function splitNumbered(txt: string): string[] {
  return txt.split(/\s*\d+\)\s*/).filter(s => s.trim() !== '').map(s => s.replace(/[.\s]+$/, '').trim());
}
function splitDots(txt: string): string[] {
  return txt.split('·').map(s => s.replace(/[.\s]+$/, '').trim()).filter(Boolean);
}

/* Audio exercises are self-describing via their title (so they need no
   EX_TYPES entry): "Listen and …" → listen (write English) / listenmatch
   (match) / dictation (write the Catalan). */
function audioType(headHtml: string): ExerciseType | null {
  const t = headHtml.replace(/<[^>]+>/g, '');
  if (!/^\s*Listen\b/i.test(t)) return null;
  if (/\bmatch\b/i.test(t)) return 'listenmatch';
  if (/\benglish\b/i.test(t)) return 'listen';
  return 'dictation';
}

function parseExercise(id: string, type: ExerciseType, headHtml: string, body: string,
  answerKey: Record<string, string>): Exercise {
  const keyHtml = answerKey[id] || '';
  const keyTxt = stripTags(keyHtml);
  const liMatches = [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]);
  const noteM = body.match(/<p class="note">[\s\S]*?<\/p>/);
  const ex: Exercise = {
    id, type, title: headHtml, items: [],
    noteHtml: noteM ? extBlank(noteM[0]) : '', keyHtml,
  };

  if (type === 'gap') {
    const overrides = ANSWER_OVERRIDES[id] || null;
    const keyItems = overrides ? null : splitNumbered(keyTxt);
    liMatches.forEach((li, i) => {
      const gaps = (li.match(/<span class="fill">/g) || []).length;
      assert(gaps >= 1, id + ' gap item without fill: ' + li);
      let answers: string[];
      if (overrides) answers = overrides[i];
      else {
        const raw = keyItems![i];
        assert(raw !== undefined, id + ' missing key item ' + (i + 1));
        answers = gaps > 1 ? raw.split(' / ').map(s => s.trim()) : [raw];
        assert(answers.length === gaps, id + ' item ' + (i + 1) + ': ' + gaps + ' gaps vs ' + answers.length + ' answers');
      }
      (ex.items as GapItem[]).push({ html: li, gaps, answers });
    });
  } else if (type === 'write') {
    const keyItems = (id === '3.2' || id === '4.1') ? splitDots(keyTxt) : splitNumbered(keyTxt);
    assert(keyItems.length === liMatches.length, id + ': ' + liMatches.length + ' items vs ' + keyItems.length + ' answers');
    liMatches.forEach((li, i) => (ex.items as WriteItem[]).push({ html: li, answers: [keyItems[i]] }));
    ex.ipa = IPA_INPUT_EX.has(id);
    ex.caps = CAPS_EX.has(id);
  } else if (type === 'tf') {
    const keyItems = splitNumbered(keyTxt);
    assert(keyItems.length === liMatches.length, id + ' tf count mismatch');
    liMatches.forEach((li, i) => {
      const raw = keyItems[i];
      const val = /^true/i.test(raw) ? true : /^false/i.test(raw) ? false : null;
      assert(val !== null, id + ' tf unparsable: ' + raw);
      ex.items.push({ html: li, answer: val, note: raw.replace(/^(true|false)\s*(—\s*)?/i, '').trim() });
    });
  } else if (type === 'match') {
    const pairs = [...keyTxt.matchAll(/(\d+)-([a-e])/g)].map(m => [m[1], m[2]] as const);
    assert(pairs.length === liMatches.length, id + ' match count mismatch');
    liMatches.forEach(li => {
      const m = stripTags(li).match(/^(.*?)\s*\(([a-e])\)\s*(.*)$/);
      assert(m, id + ' match item unparsable: ' + li);
      (ex.items as MatchItem[]).push({ left: m[1].trim(), letter: m[2], right: m[3].trim() });
    });
    ex.pairs = Object.fromEntries(pairs);
  } else if (type === 'reorder') {
    const keyItems = splitNumbered(keyTxt);
    assert(keyItems.length === liMatches.length, id + ' reorder count mismatch');
    liMatches.forEach((li, i) => {
      const tokens = stripTags(li).split(' / ').map(s => s.trim()).filter(Boolean);
      ex.items.push({ tokens, answer: keyItems[i] });
    });
  } else if (type === 'choice') {
    const cats: Record<string, string> = {};
    keyTxt.split('·').forEach(part => {
      const [cat, words] = part.split(':');
      words.split(',').map(s => s.replace(/\.$/, '').trim()).forEach(w => { cats[w] = cat.trim(); });
    });
    ex.options = [...new Set(Object.values(cats))].sort();
    liMatches.forEach(li => {
      const word = stripTags(li);
      assert(cats[word], id + ' uncategorised item: ' + word);
      ex.items.push({ html: li, answer: cats[word] });
    });
  } else if (type === 'paradigm') {
    const forms = keyTxt.replace(/\.$/, '').split(',').map(s => s.trim());
    assert(forms.length === 6, id + ' expected 6 forms, got ' + forms.length);
    const persons = ['jo', 'tu', 'ell/ella', 'nosaltres', 'vosaltres', 'ells/elles'];
    forms.forEach((f, i) => {
      const fm = f.match(/^(\S+)\s*(\/[^/]+\/)?$/);
      (ex.items as WriteItem[]).push({ html: persons[i], answers: [fm ? fm[1] : f], ipaNote: fm && fm[2] ? fm[2] : '' });
    });
  } else if (type === 'model') {
    liMatches.forEach(li => ex.items.push({ html: li }));
    if (!liMatches.length && noteM) ex.items.push({ html: '' });
  } else if (type === 'free' || type === 'personal') {
    liMatches.forEach(li => ex.items.push({ html: li }));
    ex.oral = ORAL_EX.has(id);
  } else if (type === 'listen') {
    const keyItems = splitNumbered(keyTxt);
    assert(keyItems.length === liMatches.length, id + ' listen count mismatch');
    liMatches.forEach((li, i) => {
      const ca = stripTags(li).trim();
      const answers = keyItems[i].split(' / ').map(s => s.trim()).filter(Boolean);
      assert(ca && answers.length, id + ' listen item ' + (i + 1) + ' incomplete');
      (ex.items as ListenItem[]).push({ ca, answers });
    });
  } else if (type === 'listenmatch') {
    // "<spoken Catalan> = <shown label>" (label optional, e.g. a digit);
    // audio ↔ written identity match, no answer key needed
    liMatches.forEach(li => {
      const [ca, label] = stripTags(li).split(/\s*=\s*/);
      assert(ca && ca.trim(), id + ' listenmatch empty item');
      (ex.items as ListenItem[]).push({ ca: ca.trim(), answers: [], label: label?.trim() || undefined });
    });
  } else if (type === 'dictation') {
    // hear the Catalan, write it — the spoken text is its own answer
    liMatches.forEach(li => {
      const ca = stripTags(li).trim();
      assert(ca, id + ' dictation empty item');
      (ex.items as ListenItem[]).push({ ca, answers: [ca] });
    });
  }
  return ex;
}

// ------------------------------------------------------------------- parse

function parse(): Course {
  const src = fs.readFileSync(path.join(process.cwd(), 'course_source.html'), 'utf8');
  const bodyHtml = src.slice(src.indexOf('<body>') + 6, src.indexOf('</body>'));
  const allBlocks = topLevel(bodyHtml);
  const unitDivs = allBlocks.filter(b => b.tag === 'div' && b.cls === 'unit');
  const answerDivs = allBlocks.filter(b => b.tag === 'div' && b.cls === 'answers');

  let ipaGuideDiv: Block | null = null, examPrepDiv: Block | null = null,
    mockDiv: Block | null = null, glossaryDiv: Block | null = null;
  const rawUnits: { num: number; div: Block }[] = [];
  for (const d of unitDivs) {
    const numM = d.inner.match(/<div class="unit-num">([^<]*)<\/div>/);
    if (!numM) { ipaGuideDiv = d; continue; }
    const label = numM[1].trim();
    const um = label.match(/^Unit (\d+)$/);
    if (um) rawUnits.push({ num: +um[1], div: d });
    else if (/Exam preparation/.test(label)) examPrepDiv = d;
    else if (/Mock exam/.test(label)) mockDiv = d;
    else if (/Appendix/.test(label)) glossaryDiv = d;
  }
  assert(rawUnits.length === 12, 'expected 12 units, got ' + rawUnits.length);
  assert(ipaGuideDiv && examPrepDiv && mockDiv && glossaryDiv, 'missing special sections');

  const introStart = bodyHtml.indexOf('<h1 class="page-title">How to use this course</h1>');
  const introEnd = bodyHtml.indexOf('<!-- IPA GUIDE -->');
  const introHtml = extBlank(bodyHtml.slice(introStart, introEnd));

  // glossary
  const glosTableM = glossaryDiv.inner.match(/<table class="glos">([\s\S]*?)<\/table>/);
  assert(glosTableM, 'glossary table not found');
  const glossary = [...glosTableM[1].matchAll(
    /<tr><td class="ca">([\s\S]*?)<\/td><td class="pron">([\s\S]*?)<\/td><td class="en">([\s\S]*?)<\/td><td>(\d+)<\/td><\/tr>/g,
  )].map(m => ({ ca: stripTags(m[1]), ipa: stripTags(m[2]), en: stripTags(m[3]), unit: +m[4] }));
  assert(glossary.length === 275, 'expected 275 glossary rows, got ' + glossary.length);

  // answer key
  const answerKey: Record<string, string> = {};
  {
    const re = /<span class="ak">([^<]+)<\/span>([\s\S]*?)(?=<span class="ak">|<\/div>|<h3>)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(answerDivs[0].inner))) {
      answerKey[stripTags(m[1]).trim()] = m[2].replace(/^[\s.·]+/, '').replace(/\s+$/, '').trim();
    }
  }
  assert(answerKey['1.1'] && answerKey['12.4'] && answerKey['Paper 1'], 'answer key parse failed');

  // checklist
  const checklistDiv = answerDivs[1];
  const checklist = [...checklistDiv.inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1].trim());
  assert(checklist.length === 15, 'expected 15 checklist items, got ' + checklist.length);
  const checklistFootM = checklistDiv.inner.match(/<p class="note"[^>]*>[\s\S]*?<\/p>/);
  const citeM = checklistDiv.inner.match(/<p><small class="cite">[\s\S]*?<\/small><\/p>/);

  // units
  let totalEx = 0;
  const units: Unit[] = rawUnits.map(({ num, div }) => {
    const headM = div.inner.match(/<div class="unit-head">[\s\S]*?<h2>([\s\S]*?)<\/h2>/);
    assert(headM, 'unit ' + num + ' head missing');
    const blocks: UnitBlock[] = [];
    const exerciseIds: string[] = [];
    for (const b of topLevel(div.inner)) {
      if (b.tag === 'div' && b.cls === 'unit-head') continue;
      if (b.tag === 'div' && b.cls === 'ex') {
        const labM = b.inner.match(/<span class="label">EX ([\d.]+)<\/span>/);
        assert(labM, 'exercise without label in unit ' + num);
        const id = labM[1];
        const titleM = b.inner.match(/<h4>([\s\S]*?)<\/h4>/);
        assert(titleM, 'exercise without title: ' + id);
        const type = audioType(titleM[1]) ?? EX_TYPES[id];
        assert(type, 'exercise ' + id + ' missing from EX_TYPES — source changed?');
        blocks.push({ kind: 'exercise', ex: parseExercise(id, type, titleM[1], b.inner, answerKey) });
        exerciseIds.push(id);
        totalEx++;
      } else {
        blocks.push({ kind: 'html', html: extBlank(b.outer) });
      }
    }
    return { num, title: headM[1], blocks, exerciseIds };
  });
  assert(totalEx === 108, 'expected 108 exercises, got ' + totalEx);
  assert(Object.keys(EX_TYPES).length === 83, 'EX_TYPES must list exactly 83 keyed (non-audio) exercises');

  // mock exam
  const papers = topLevel(mockDiv.inner).filter(b => b.tag === 'div' && b.cls === 'exam');
  assert(papers.length === 4, 'expected 4 mock papers, got ' + papers.length);
  const introNoteM = mockDiv.inner.match(/<p class="note">[\s\S]*?<\/p>/);
  assert(introNoteM, 'mock intro note missing');
  const scriptM = papers[0].inner.match(/<p class="note">«([\s\S]*?)»<\/p>/);
  assert(scriptM, 'listening script missing');
  const p1items = [...papers[0].inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => stripTags(m[1]));
  const p1answers = splitNumbered(stripTags(answerKey['Paper 1'])).map(raw => ({
    val: /^V/.test(raw), note: raw.replace(/^[VF]\s*(—\s*)?/, '').trim(),
  }));
  assert(p1items.length === 6 && p1answers.length === 6, 'paper 1 parse');

  const p2noticeM = papers[1].inner.match(/<p class="note">«([\s\S]*?)»<\/p>/);
  assert(p2noticeM, 'paper 2 notice missing');
  const p2ols = [...papers[1].inner.matchAll(/<ol class="q">([\s\S]*?)<\/ol>/g)];
  const p2aItems = [...p2ols[0][1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => stripTags(m[1]));
  const p2bItems: MatchItem[] = [...p2ols[1][1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => {
    const mm = stripTags(m[1]).match(/^(.*?)\s*\(([a-e])\)\s*(.*)$/);
    assert(mm, 'paper 2B item unparsable');
    return { left: mm[1].trim(), letter: mm[2], right: mm[3].trim() };
  });
  const p2bPairs = Object.fromEntries(
    [...stripTags(answerKey['Paper 2B']).matchAll(/(\d+)-([a-e])/g)].map(m => [m[1], m[2]]));
  assert(p2aItems.length === 4 && p2bItems.length === 5, 'paper 2 parse');

  const p3form = [...papers[2].inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]);
  const p3bTaskM = papers[2].inner.match(/<p><b>Task B[\s\S]*?<\/p>/);
  assert(p3form.length === 5 && p3bTaskM, 'paper 3 parse');

  const p4qs = [...papers[3].inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => stripTags(m[1]));
  const p4roleM = papers[3].inner.match(/<p><b>Part 2[\s\S]*?<\/p>/);
  const p4markM = papers[3].inner.match(/<p><b>Self-marking guide[\s\S]*?<\/p>/);
  assert(p4qs.length === 8 && p4roleM && p4markM, 'paper 4 parse');

  const mock: MockData = {
    introNote: introNoteM[0], script: scriptM[1],
    p1items, p1answers,
    p2notice: p2noticeM[1], p2aItems, p2aKeyHtml: answerKey['Paper 2A'], p2bItems, p2bPairs,
    p3form, p3bTask: p3bTaskM[0], p3bModel: answerKey['Paper 3B model (38 words)'],
    p4qs, p4role: p4roleM[0], p4mark: p4markM[0],
    p4model: answerKey['Paper 4 model answers (Part 1)'],
    p4roleModel: answerKey['Paper 4 role-play skeleton'],
  };

  // condensed IPA cheat sheet for the always-available drawer: everything
  // from the "Vowels" heading up to (not including) the resources box.
  const ipaCheatParts: string[] = [];
  let collecting = false;
  for (const b of topLevel(ipaGuideDiv.inner)) {
    if (b.tag === 'h3' && /Vowels/.test(b.inner)) collecting = true;
    if (b.tag === 'div' && b.cls === 'res') collecting = false;
    if (collecting) ipaCheatParts.push(b.outer);
  }
  const ipaCheatHtml = ipaCheatParts.join('\n');
  assert(/Vowels/.test(ipaCheatHtml) && /golden rule/.test(ipaCheatHtml) && /Consonants/.test(ipaCheatHtml),
    'IPA cheat sheet extraction failed');

  return {
    counts: { units: 12, exercises: totalEx, glossary: glossary.length },
    introHtml,
    ipaGuideHtml: extBlank(ipaGuideDiv.inner),
    ipaCheatHtml,
    examInfoHtml: extBlank(examPrepDiv.inner),
    units, glossary, checklist,
    checklistFootHtml: checklistFootM ? checklistFootM[0] : '',
    citeHtml: citeM ? extBlank(citeM[0]) : '',
    mock,
  };
}

let cached: Course | null = null;
export function getCourse(): Course {
  if (!cached) cached = parse();
  return cached;
}
