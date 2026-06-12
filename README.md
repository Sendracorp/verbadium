# Catalan from Scratch — interactive A1 course

An interactive course site for a complete beginner's course in Central
Catalan (CEFR A1), built to prepare for the official A1 exam
(*Certificat de nivell inicial de català*). **Next.js + TypeScript + React**,
deployable on Vercel with zero configuration.

* **12 units** of theory, vocabulary (300+ words, every one with IPA),
  dialogues and verified external resources
* **83 interactive exercises** auto-marked from the course answer key
  (gap-fill, matching, reorder, true/false, translation with model answers,
  free writing, oral rehearsal…)
* 🔊 **audio on every Catalan word, phrase and dialogue line** — vocabulary
  uses **native-speaker recordings** (Lingua Libre / Wikimedia Commons,
  CC BY-SA 4.0, shipped as static MP3s); sentences and dialogues fall back
  to the Web Speech API (prefers a `ca-ES` voice)
* a full **mock A1 exam** — TTS listening paper, optional exam-condition
  timers, auto-marking, attempt history
* a searchable, sortable **glossary** (275 entries)
* **progress tracking** in your browser (localStorage): per-exercise states,
  per-unit bars, an overall dashboard and the A1 self-assessment checklist —
  nothing you type ever leaves your browser

## Run it locally

```sh
npm install
npm run dev          # http://localhost:3000
```

Production build (this is also what Vercel runs):

```sh
npm run build && npm start
```

## Native pronunciation audio

`scripts/fetch-native-audio.mjs` matches every Catalan vocabulary string in
the course against the ~23,000 native-speaker recordings of the
[Lingua Libre](https://lingualibre.org) project on Wikimedia Commons,
downloads the MP3s into `public/audio/ca/` (committed — no runtime
dependency on Commons) and writes `lib/native-audio.json`. At runtime
`speak()` plays the native recording when one exists — chaining the parts of
multi-word entries like *abril, maig, juny* — and falls back to Web Speech
TTS for sentences and dialogue lines. Re-run the script only when course
vocabulary changes. Attribution (CC BY-SA 4.0) is rendered on the glossary
page from the manifest's credits.

**Recording the rest yourself**: the script writes `recordings/TODO.txt` —
every sentence/dialogue line still on TTS. Record them with a native
speaker, map them in `recordings/index.json`
(`{ "Quants anys tens?": "quants-anys.mp3" }`, files in the same folder) and
re-run the script; own recordings take priority over everything.

## Source of truth

The entire course lives in `course_source.html`. Pages are generated from it
at build time by `lib/course.ts`, which **asserts content fidelity** —
exactly 12 units, 83 exercises and 275 glossary rows — and fails the build
if the source drifts. To change course content, edit `course_source.html`
and rebuild. See `DESIGN.md` for the architecture and `DECISIONS.md` for the
choices made.

## Deploy on Vercel

Import the GitHub repo at <https://vercel.com/new> (or `vercel link` +
`vercel deploy` with the CLI). Vercel auto-detects Next.js; no settings
needed. Every push to `main` redeploys; all routes are statically
prerendered at build time.

## QA suite

```sh
npm run build && npx next start -p 3411 &
cd qa && npm install && node test.js http://localhost:3411/
```

Click-tests one exercise of every type, audio wiring, persistence across
reloads, the mock exam and a 380 px mobile viewport.

## Roadmap

- [ ] **Sentence/dialogue audio**: the 237 texts in `recordings/TODO.txt`
      still use browser TTS. Either record them with a native speaker
      (drop files in `recordings/` + `index.json`, re-run
      `scripts/fetch-native-audio.mjs`) or pre-generate static MP3s with
      Azure neural Catalan TTS (`ca-ES-JoanaNeural` / `EnricNeural` /
      `AlbaNeural`, free tier covers the whole course) once an Azure
      Speech key exists.
