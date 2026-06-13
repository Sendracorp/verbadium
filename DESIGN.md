# DESIGN

## What this is

An interactive multi-page course site for a complete 12-unit Catalan A1
exam-preparation workbook, built with **Next.js (App Router) + TypeScript +
React**, deployed on **Vercel**. The entire course lives in
`course_source.html` — the single source of truth — and is parsed at build
time, never rewritten by hand.

## Architecture & data flow

```
course_source.html ──► lib/course.ts (build-time parser, server-only)
                            │  getCourse(): Course  — typed, cached
                            ▼
        app/…/page.tsx  (server components, SSG via generateStaticParams)
                            │  serializable props
                            ▼
        components/…    (client components: exercises, mock exam,
                         dashboard, glossary, speech, char strip)
                            │
        lib/check.ts    (pure answer checking)      lib/progress.ts (localStorage)
        lib/speech.ts   (Web Speech API helpers)
```

* **`lib/course.ts`** parses the source with a small depth-counting tag
  scanner (no DOM library), classifies every exercise, pairs it with the
  answer key, and **throws if the fidelity counts drift** — 12 units,
  83 exercises, 275 glossary rows, 15 checklist items — so `next build`
  fails instead of shipping lost content. Result is cached per process.
* **Routes** (all prerendered): `/` (home + progress dashboard), `/ipa`,
  `/unit/[num]` (1–12, `generateStaticParams`), `/exam`, `/mock`,
  `/glossary`.
* Theory blocks (tables, dialogues, tips, resource boxes) are rendered
  verbatim via `SpeechScope`, which sets the trusted HTML and then enhances
  it client-side with 🔊 buttons and dialogue players. External links get
  `target="_blank"` during parsing.

## Parsing conventions (from the source document)

| Thing | Markup in `course_source.html` |
|---|---|
| Unit | `<div class="unit">` with `<div class="unit-num">Unit N</div>` |
| Vocab/example row | `<td class="ca">` + `<td class="pron">/IPA/</td>` + `<td class="en">` |
| Exercise | `<div class="ex">` labelled `EX N.N` (83 total) |
| Gap | `<span class="fill">___</span>` |
| Dialogue | `<div class="dialogue">`, `.gloss` lines hold IPA + translation |
| Resources | `<div class="res">` |
| Mock exam papers | `<div class="exam">` (4 of them) |
| Glossary | `<table class="glos">`, 275 rows CA/IPA/EN/unit |
| Answer key | `<div class="answers">`, `<span class="ak">N.N</span>` markers |

## Exercise typing

Every exercise id is listed explicitly in `EX_TYPES` in `lib/course.ts`; a
source change that renames/adds an exercise fails the build. The client
engine is `components/exercises.tsx`:

| Type | Count | UI | Checking |
|---|---|---|---|
| `gap` | 24 | inputs inline in the sentence | auto vs key; accent-lenient |
| `write` | 16 | prompt + one input | auto (IPA-lenient EX 1.1, CAPS-stress EX 1.3) |
| `model` | 25 | input per item + “Show model answer” | per-item self-mark ✓/✗ |
| `free` | 10 | textarea (+ “I said it aloud” for oral) + model reveal | self-mark |
| `match` | 2 | tap-to-pair two columns (`MatchBoard`, reused by the mock) | auto |
| `reorder` | 2 | click word chips in sequence | auto (parens/punctuation-tolerant) |
| `tf` | 1 | True/False buttons | instant, with the key’s explanation |
| `choice` | 1 | category buttons (menjar/beguda) | instant |
| `paradigm` | 1 | six labelled inputs (EX 5.4) | auto, reveals the jo-form IPA |
| `personal` | 1 | personal-data form (EX 12.5) | “Done” self-mark |

Multi-gap answers (`12.2`, `8.5`) are split on ` / ` from the key with count
assertions; two ambiguous keys (`6.2`, `6.3`) are curated in
`ANSWER_OVERRIDES`. Accent-lenient marking: a match after stripping
diacritics counts correct but shows amber “✓ (check the accents!)”
(`lib/check.ts`).

## Audio (`lib/speech.ts`, `components/SpeechScope.tsx`)

* 🔊 on every `td.ca` / `span.ca` and every dialogue line — but not inside
  exercises (would give answers away) or model-answer boxes.
* **Native recordings first**: `speak()` normalizes the text and looks it up
  in `lib/native-audio.json` (built by `scripts/fetch-native-audio.mjs` from
  Lingua Libre / Wikimedia Commons, CC BY-SA 4.0, static MP3s in
  `public/audio/ca/`). Multi-part entries chain their recordings; playback
  errors fall through to the TTS path, never a dead button.
* TTS fallback (sentences, dialogues, mock listening): prefer exact `ca-ES`,
  else any `ca*`; `onvoiceschanged` re-picks. No Catalan voice → one-time
  dismissible notice linking forvo.com/languages/ca (dismissal persisted).
* Dialogues: “▶ Play whole dialogue”, sequential lines, current line
  highlighted. Mock Paper 1 speaks the hidden script twice with a 5 s pause.

## Progress (localStorage, namespaced `catalanA1.*` — `lib/progress.ts`)

* `catalanA1.ex.<id>` → `{state: untouched|attempted|passed, score, total, ts}`
* `catalanA1.checklist` → boolean[15]; `catalanA1.mock.attempts` → dated list
* `catalanA1.mock.conditions`, `catalanA1.ttsNoticeDismissed` → flags

A tiny pub/sub re-renders the sidebar badges and dashboard on any change.
Storage is only read **after hydration** (initial client render matches the
server-rendered zeros) to avoid hydration mismatches.

## Tests (`tests/`, TypeScript)

Two layers, per the 2026 Next.js-team convention:

* **Vitest** (`tests/unit/`) — pure logic, no browser: `lib/check.ts`
  marking, the catalog, and the native-audio key/manifest (asserts every
  referenced MP3 exists on disk). The audio-key normalization is extracted to
  `lib/native-audio-key.ts` so the runtime player, the build-time matcher and
  the test all share one implementation.
* **Playwright Test** (`tests/e2e/`) — real-browser flows; `playwright.config.ts`
  starts `next dev` itself (normal mode, no `COURSE_BYPASS_PAYWALL`).
  `gating.spec.ts` is the logged-out path (no Supabase needed).
  `auth.spec.ts`/`content.spec.ts` log in a real course-owning user created
  and torn down through the Supabase admin API in a worker-scoped fixture
  (`tests/helpers/`), so gated content is reached via the actual access path
  and progress is asserted round-tripping through Postgres. They `test.skip`
  when Supabase creds are placeholders.

Run: `npm test` (both), `npm run test:unit`, or `npm run test:e2e`.

## IPA quick-reference drawer

A tab fixed to the right edge of **every** page (`components/IpaDrawer.tsx`,
mounted in the root layout) slides out a drawer with the condensed IPA
reference, so the student can check a symbol at any moment without leaving
the exercise. Content is extracted at build time (`ipaCheatHtml` in
`lib/course.ts`): everything from the "Vowels" heading to the resources box
of the IPA guide — both sound tables, the golden-rule tip and the
pronunciation-habits note — and passed through `SpeechScope`, so every
example word keeps its 🔊 button. Closes via the ×, the backdrop, or Escape;
links to the full `/ipa` guide. At ≤480 px the drawer takes 94 vw and its
tables scroll horizontally. SpeechScope idempotence is judged from the
actual content (`.say`/`.dialogue-controls` present?) on every commit, not a
one-shot flag — React can re-apply `dangerouslySetInnerHTML` content on
subtree re-renders (hydration click-replay), which would otherwise silently
strip the injected buttons.

## Platform layer (accounts, payments, multi-course)

```
                    ┌─ Supabase Auth (email/password + Google, @supabase/ssr cookies)
browser ── proxy.ts ┤
                    └─ Postgres + RLS: profiles · purchases · exercise_progress
                                       · mock_attempts · checklist_state
                                       (schema: supabase/migrations/0001_init.sql)

/                      catalog (lib/courses.ts metadata, state-aware CTAs)
/courses/[slug]        course home: sales page ⟂ dashboard (by ownership)
/courses/[slug]/…      unit/ipa/exam/mock/glossary — server-side gating via
                       lib/access.ts; Paywall rendered instead of content
/login /signup /…      Supabase auth flows, /auth/callback exchanges codes
/account /admin        purchases view · service-role admin overview
/api/checkout          auth gate returning Paddle overlay params (logged in)
/api/webhooks/paddle   HMAC-verified Paddle webhook — sole writer of purchases
```

* **Access control** is evaluated per request in server components
  (`getCourseAccess` → user + ownership); free-preview units come from
  `CourseMeta.freeUnits`. Nothing gated is ever serialized to the client.
* **Progress** (`lib/progress.ts`) keeps the original synchronous API used
  by the exercise engine. `<ProgressProvider>` (mounted in the course
  layout) seeds an in-memory cache from a server fetch; writes are
  optimistic with a retrying push queue to Supabase. Logged out → plain
  localStorage, namespaced `cfs.<slug>.*`.
* **QA** is split: `qa/test.js` (content/exercises, run with
  `COURSE_BYPASS_PAYWALL=true`) and `qa/gating.test.js` (paywall, redirects,
  auth pages, checkout/webhook rejection — run against a normal server).
