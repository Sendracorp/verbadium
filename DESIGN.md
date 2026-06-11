# DESIGN

## What this is

An interactive multi-page static website generated from `course_source.html`,
a complete 12-unit Catalan A1 exam-preparation workbook. Plain HTML/CSS/JS —
no frameworks, no build step required to *serve* it (a Node script generates
the pages once), no server. Works from `file://` and from GitHub Pages.

## Architecture & data flow

```
course_source.html  ──►  node build.js  ──►  index.html, ipa.html,
   (source of truth)        │                unit01–12.html, exam.html,
                            │                mock.html, glossary.html
                            └──────────►     data.js  (answers & metadata)

style.css, app.js  (hand-written, static)    qa/test.js  (Playwright QA)
```

* **`build.js`** parses the source, asserts fidelity counts (**12 units,
  83 exercises, 275 glossary rows, 15 checklist items** — the build fails
  hard if any drifts), classifies every exercise, pairs it with the answer
  key, and writes the pages plus `data.js`.
* **`data.js`** defines `window.CAT`: per-exercise answer data keyed by
  exercise id (`"2.1"`…), unit metadata, mock-exam keys, and the counts.
  It is loaded as a plain `<script>` (not `fetch`) so `file://` works.
* **`app.js`** is the only runtime: navigation, Web Speech audio, the
  exercise engine, progress persistence, glossary search/sort, mock exam.

## Parsing conventions (from the source document)

| Thing | Markup in `course_source.html` |
|---|---|
| Unit | `<div class="unit">` with `<div class="unit-num">Unit N</div>` |
| Vocab/example row | `<td class="ca">` + `<td class="pron">/IPA/</td>` + `<td class="en">` |
| Exercise | `<div class="ex">` labelled `EX N.N` (83 total) |
| Gap | `<span class="fill">___</span>` |
| Dialogue | `<div class="dialogue">`, `.gloss` lines hold IPA + translation |
| Resources | `<div class="res">` (links kept verbatim, `target="_blank"` added) |
| Mock exam papers | `<div class="exam">` (4 of them) |
| Glossary | `<table class="glos">`, 275 rows CA/IPA/EN/unit |
| Answer key | `<div class="answers">`, `<span class="ak">N.N</span>` markers |

The HTML is machine-regular, so `build.js` uses a small depth-counting
element scanner (`topLevel`/`matchTag`) rather than a DOM library — zero
dependencies for the build.

## Exercise typing

Every exercise id is listed explicitly in `EX_TYPES` in `build.js` (a source
change that renames/adds an exercise fails the build). Types:

| Type | Count | UI | Checking |
|---|---|---|---|
| `gap` | 24 | text inputs in the sentence | auto vs key; accent-lenient |
| `write` | 16 | prompt + one input | auto vs key (IPA-lenient for EX 1.1, CAPS-stress for EX 1.3) |
| `model` | 25 | input per item + “Show model answer” | per-item self-mark ✓/✗ |
| `free` | 10 | textarea (+ “I said it aloud” for oral ones) + model reveal | self-mark |
| `match` | 2 | tap-to-pair two columns | auto |
| `reorder` | 2 | click word chips in sequence | auto (punctuation/parens-tolerant compare) |
| `tf` | 1 | True/False buttons | instant, with the key’s explanation |
| `choice` | 1 | category buttons (menjar/beguda) | instant |
| `paradigm` | 1 | six labelled inputs (EX 5.4) | auto, reveals the jo-form IPA |
| `personal` | 1 | personal-data form (EX 12.5) | “Done” self-mark |

Multi-gap answers (`12.2`, `8.5`) are split on ` / ` from the key with a
count assertion. Two ambiguous keys (`6.2`, `6.3`, where the key repeats the
noun) are hand-curated in `ANSWER_OVERRIDES`.

**Accent leniency:** an answer that matches after stripping diacritics is
counted correct but shown amber with “✓ (check the accents!)”.

## Audio (Web Speech API)

* `injectSpeech()` adds a 🔊 button to every `td.ca` / `span.ca` and every
  dialogue line — except inside exercises (where IPA/words would give the
  answer away) and model-answer boxes.
* Voice: prefer exact `ca-ES`, else any `ca*`; `onvoiceschanged` re-picks.
  If no Catalan voice exists, a one-time dismissible notice links to
  forvo.com/languages/ca (dismissal persisted).
* Dialogues get “▶ Play whole dialogue”: lines are spoken sequentially with
  the current line highlighted.
* Mock Paper 1 speaks the hidden script twice with a 5 s pause.

## Progress (localStorage, namespaced `catalanA1.*`)

* `catalanA1.ex.<id>` → `{state: untouched|attempted|passed, score, total, ts}`
* `catalanA1.checklist` → boolean array (15 items)
* `catalanA1.mock.attempts` → array of dated attempt summaries
* `catalanA1.mock.conditions`, `catalanA1.ttsNoticeDismissed` → flags

Unit nav badges (`passed/total`), per-unit bars and the index dashboard all
derive from these keys at page load (`refreshProgress()`); “Reset all
progress” removes every `catalanA1.*` key after a confirm.

## QA

`qa/test.js` (Playwright, headless Chromium) drives the real site from
`file://` or any URL passed as argv: count assertions in the DOM, one
click-test per exercise type, accent-leniency, localStorage persistence
across reloads, glossary search/sort, mock listening/matching/timers/attempt
history, 380 px viewport (hamburger nav, no horizontal scroll), reset.
Run: `cd qa && npm i && node test.js [url]`.
