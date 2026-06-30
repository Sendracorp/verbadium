/goal Build the **Catalan A2 course** for Verbadium, mirroring the exact methodology, architecture and quality bar of the existing Catalan A1 course — aligned to the official A2 certificate, with maximal native-speaker audio. Work on the `a2` branch.

---

## 0. Read these first — replicate A1's methodology exactly
A2 must be **additive and backward-compatible**: A1 rendering stays unchanged; A2 follows the same conventions. Before authoring anything, study:
- `LOCALIZATION.md` — spine vs teaching-layer split, multi-level/multi-medium scaling, audio architecture.
- `DECISIONS.md` — the 30+ design decisions (grammar testing, native-audio sourcing, accent-lenient marking, self-marked free/model exercises, "medium = presentation, not product", etc.).
- `README.md` — audio scripts, env vars, build.
- `course_source.html` — the single-source authoring format. Match its structure exactly.
- `lib/course.ts` (parser + build-time fidelity asserts), `lib/types.ts`, `lib/content.ts`, `lib/courses.ts`, `lib/i18n-course.ts`, `lib/native-audio-key.ts`, `lib/speech.ts`, `lib/check.ts`, `app/admin/audio/page.tsx`.

## 1. Target — the official A2 level
A2 = **Certificat de nivell bàsic de català (A2)** (Generalitat de Catalunya). Note: the company is domiciled in **Andorra**, which runs its own official Catalan exams — align to both where they differ. Verify every link is live (HTTP 200) and cite them in the course as A1 does:
- Generalitat A2 cert (structure & areas): https://llengua.gencat.cat/ca/serveis/acreditacio_coneixements/certificats_de_catala/certificats_estructura_i_descripcio_proves/certificat_de_nivell_basic_de_catala_a_basic/
- CPNL grammar contents (Bàsic 1/2/3 = the A2 syllabus): https://www.cpnl.cat/gramatica/nivell/basic-1 · /basic-2 · /basic-3
- Andorra official exams: https://www.govern.ad/ca/tematiques/cultura-i-esports/llengua/examens-oficials
- Intercat certificates: https://www.intercat.cat/en/certificates
- Institut Ramon Llull (external exams): https://www.llull.cat/english/aprendre_catala/certificats_intro.cfm

**Mock exam must mirror the official A2 areas & weights:**
| Area | Weight | Time |
|---|---|---|
| Communicative appropriateness | 15% | 15 min |
| Listening comprehension | 30% | 30 min |
| Reading comprehension | 25% | 45 min |
| Speaking | 30% | 15 min |

Pass = **≥60% on speaking AND ≥60% across the rest.** (Writing is taught/practised in units, but the scored mock follows these official areas.) Adapt the A1 `MockData` shape accordingly (add a "communicative appropriateness" part; keep self-marking + model answers).

## 2. Syllabus — bigger than A1, driven by the official contents
A1 = 12 units / 108 exercises / 275 glossary. **A2 must be larger** — target **~14–16 units, ~140–170 exercises, ~400–550 glossary entries** — but final counts are driven by covering the A2 syllabus, not by hitting a number. **Build on A1**: assume A1 knowledge, don't re-teach it; advance.

**Grammar to cover** (from the official CPNL contents):
- Past tenses and their contrast: **passat perifràstic** (vaig parlar), **perfet** (he parlat), **imperfet** (parlava) — when to use each.
- **Future** and **conditional**; **imperative**; non-personal forms (infinitiu, gerundi, participi).
- All three conjugations incl. common irregulars; **ser/estar/anar/venir** + **pronominal (reflexive) verbs**.
- Pronouns: **weak/clitic** (en, hi, em, et, el/la, li, els…), strong, and **combined** forms (l'hi, n'hi, etc.) — a defining A2 difficulty.
- Indirect object; possessives, demonstratives, quantifiers/indefinites; comparatives & superlatives; adverbs; prepositions & contractions (del, al, pel…).

**Lexical / functional themes:** extended personal & character description, clothing/colours, family & relationships, occupations & workplace, body & health, food & restaurant, home + city/rural, daily routine & time, weather/seasons, leisure, travel & directions, shopping, telephone & courtesy, opinions/agreement & disagreement, apologies, suggestions, and **narrating past events** (the big new A2 communicative goal).

## 3. Methodology — identical to A1 (do not invent a new architecture)
- **Single-source HTML:** author `course_source_a2.html` in the SAME semantic structure as `course_source.html` — intro, short IPA refresher (A2 learners know it), N unit blocks (unit-head + "can-do" + theory tables + dialogues with glosses+IPA + Resources box + inline exercises "EX n.m"), exam-prep section, mock exam, glossary appendix, full answer key.
- **Parser + asserts:** extend `lib/course.ts` (or a parallel A2 parse path) so A2 parses with **build-time fidelity asserts** (exact unit/exercise/glossary/checklist counts) — content can never silently drift.
- **Spine vs teaching layer:** Catalan text, IPA, answer keys and audio keys = **spine** (authored once, never translated). Unit prose, can-do statements, exercise titles/instructions/items, glosses, glossary English column, model answers, exam info = **teaching layer** (translated per medium).
- **Exercise types:** reuse the existing **13 types** only (`gap, write, paradigm, tf, choice, match, reorder, model, free, personal, listen, listenmatch, dictation`). Lean into the harder ones at A2: `paradigm` for the new tenses, `reorder` for clitic/combined-pronoun word order, `listen`/`dictation`/`listenmatch` for the heavier listening weight, `free`/`personal` for production. Add a new engine type only if genuinely unavoidable.
- **Glossary:** `ca / ipa / en / unit` rows, full IPA on every entry, keyed `gloss.<unit>.<catalan>`.
- **i18n:** extract catalog → `i18n/catalan-a2.en.json` → copy & translate to `.es/.fr/.ru/.de.json` (identical key set; preserve inline `<span class="ca">` Catalan spans untouched). Then run a **native-style review pass** per language (as was done for A1).
- **Wire-up:** add A2 to `lib/courses.ts` (`family: 'catalan-a2'`, `level: 'A2'`, stats, `freeUnits: [1]`, price), `lib/content.ts` (slug → A2 course), the 5 variants (en/es/fr/ru/de), and a Paddle product + `PADDLE_PRICE_CATALAN_A2`. Keep `available: false` until complete, then flip it — the catalog "Coming next" card becomes the live A2, and SEO/sitemap/hreflang flow through automatically.

## 4. Audio — MAXIMIZE native speakers (explicit priority)
Audio is **course-agnostic** (keyed by Catalan text via `nativeKey()`), shared across A1/A2 — A2's new words/sentences just extend the same pipeline. Push native coverage as high as possible, in this order:
1. **Lingua Libre** (CC0/CC-BY, reusable) — primary. Run `npm run audio:native`; match every A2 word & phrase.
2. **Wikimedia Commons** "Lingua Libre pronunciation" + Catalan categories, and **Wiktionary** Catalan audio (same free corpus + extras) — extend the fetch script to also search Commons for terms Lingua Libre misses. (Reusable.)
3. **Google TTS** (`ca-ES`) — fallback ONLY for what natives don't cover. Log every TTS-only term to `recordings/TODO_a2.txt` so they can be replaced via the admin native-recording/override flow later.
4. **Forvo** — has Catalan but is **NOT reusably licensed** → never embed audio; may only be linked from a Resources box.

Deliverable: **report native vs TTS coverage %**, and minimise the TTS share.

## 5. External resource links — free, topic-matched, LIVE-VERIFIED
Like A1, each unit's "Resources" box links free external practice matched to that unit's grammar/topic. Extend A1's link families to A2 topics and add A2-specific ones. Candidates (verify each live, link to the specific lesson/exercise where possible):
- **Parla.cat** (free self-managed Bàsic 1–3): https://web.gencat.cat/en/tramits/tramits-temes/Curs-de-catala-en-linia-Parla_cat
- **Intercat** resources: https://www.intercat.cat/en/resources
- **CPNL grammar** (per topic): https://www.cpnl.cat/gramatica/
- **verbs.cat** (conjugation — heavy use at A2): https://www.verbs.cat/en/practise.html
- **talkpal.ai** grammar exercises (past tenses, pronouns): https://talkpal.ai/catalan-grammar-exercises/
- **Easy Catalan** (YouTube): https://www.youtube.com/c/EasyCatalan
- plus the A1 families (LingoHut, loecsen, UPF MOOC) where topic-relevant.

**Hard requirement:** every external link must return **HTTP 200 at authoring time** — dead links are unacceptable. Prefer stable official/educational domains.

## 6. Acceptance criteria
- `course_source_a2.html` authored; parser fidelity asserts pass (counts locked).
- A2 live in the catalog (replaces "Coming next"), buyable via Paddle, free Unit 1 preview, all 5 teaching mediums.
- Mock exam aligned to the official A2 areas/weights + 60% pass rule.
- `i18n/catalan-a2.{en,es,fr,ru,de}.json` complete; native-style review pass done.
- Audio native-first, TTS only for gaps; coverage % reported; gaps logged to `recordings/TODO_a2.txt`.
- All external links verified live (HTTP 200).
- `tsc` + unit + e2e + build (incl. fidelity asserts) all green.
- A1's "next step → A2" pointer updated to link the live A2; `LOCALIZATION.md`/`DECISIONS.md` updated with any A2 notes.

## 7. Suggested order
1. Lock the A2 unit map (units × can-do statements × grammar + lexis per unit × which exam area each serves), mapped to the official syllabus (§1–2; cross-check CPNL Bàsic 1/2/3 + the gencat structure).
2. Author `course_source_a2.html` (content, dialogues, exercises, glossary, mock exam, answer key, resources).
3. Extend the parser + asserts; wire `courses.ts` / `content.ts` / variants.
4. `npm run audio:native` (+ Commons) → TTS gaps; report coverage.
5. Extract i18n `en` → translate `es/fr/ru/de` → native-style review.
6. Create the Paddle product + env var; flip `available`; verify catalog / SEO / sitemap / hreflang.
7. Verify all links live; run tsc / unit / e2e / build; open a PR from `a2`.

**Pricing & packaging:** assume **€25 one-time** (same as A1), sold per teaching language; consider a future A1+A2 bundle (decide later). **Ask before the only irreversible step — creating the Paddle product — otherwise proceed autonomously on the `a2` branch.**
