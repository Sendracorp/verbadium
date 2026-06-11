# Catalan from Scratch — interactive A1 course

An interactive, multi-page static website for a complete beginner's course in
Central Catalan (CEFR A1), built to prepare for the official A1 exam
(*Certificat de nivell inicial de català*).

* **12 units** of theory, vocabulary (300+ words, every one with IPA),
  dialogues and verified external resources
* **83 interactive exercises** auto-marked from the course answer key
  (gap-fill, matching, reorder, true/false, translation with model answers,
  free writing, oral rehearsal…)
* 🔊 **audio on every Catalan word, phrase and dialogue line** via the Web
  Speech API (prefers a `ca-ES` voice)
* a full **mock A1 exam** — TTS listening paper, optional exam-condition
  timers, auto-marking, attempt history
* a searchable, sortable **glossary** (275 entries)
* **progress tracking** in your browser (localStorage): per-exercise states,
  per-unit bars, an overall dashboard and the A1 self-assessment checklist

Everything is plain HTML/CSS/JS — no frameworks, no server. Nothing you type
ever leaves your browser.

## Open it locally

Clone (or download) and open `index.html` in any modern browser — it works
straight from the filesystem (`file://`). No install, no server needed.

## Rebuild the pages from the source

The single source of truth is `course_source.html` (the full course as one
document). The pages are generated from it:

```sh
node build.js
```

The build asserts content fidelity — exactly 12 units, 83 exercises and 275
glossary rows — and fails if the source drifts. See `DESIGN.md` for the
architecture and `DECISIONS.md` for the choices made.

## Run the QA suite

```sh
cd qa
npm install            # Playwright + headless Chromium
node test.js           # tests the site from file://
node test.js https://…/  # or against a deployed URL
```

It click-tests one exercise of every type, audio wiring, persistence across
reloads, the mock exam and a 380 px mobile viewport.

## How deployment works

The site is served by **GitHub Pages** from the `main` branch root
(Settings → Pages → Deploy from a branch → `main` / `/ (root)`; the repo
contains a `.nojekyll` marker). Because all asset paths are relative, the
same files work locally and on Pages. To publish a change: edit
`course_source.html` (or `style.css`/`app.js`), run `node build.js`, commit
and push — Pages redeploys automatically in a minute or two.
