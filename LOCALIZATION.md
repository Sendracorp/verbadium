# Localization, audio & multi-course architecture

> **Audience: future agents / contributors.** This is the master plan for how
> Verbadium scales to **more levels** (A1 → A2 → B1…) and **more teaching
> languages** (English, Spanish, French, Russian…), and how the **audio** is
> structured. Read this before touching the course content model, the audio
> pipeline, or adding a language. It records both what is **shipped** and the
> **planned** architecture, with the rationale so decisions aren't re-litigated.

---

## 0. Mental model (the one thing to internalize)

A course has **two orthogonal dimensions**, plus a shared asset library:

```
            teaching medium (how it's explained)
            en      es      fr      ru   ...
level  A1   ▢       ▢       ▢       ▢
       A2   ▢       ▢       ▢       ▢
       B1   ▢       ▢       ▢       ▢

shared across ALL cells:  the Catalan "spine" (Catalan text, IPA,
                          exercise structure + answers) and the AUDIO.
```

- **Level** (A1, A2…) = which Catalan you learn. Each level is authored once.
- **Medium** (en/es/fr/ru) = the language the explanations/translations are in.
  A medium is a **presentation choice, NOT a separate product**.
- The **Catalan spine** and the **audio** are *shared* across every medium of a
  level. Teaching `Catalan A1` in Spanish vs French changes the prose and
  glosses — **not** the Catalan words or their audio.

**Golden rule that must never be broken:** audio and the Catalan spine are
**course/medium-agnostic, keyed by the Catalan text**. Never duplicate them per
medium, and never copy a whole course per language. (See §2, §3.)

---

## 1. Current state (shipped — June 2026)

| Area | State | Key files |
|---|---|---|
| Course content | **One level (Catalan A1)**, authored in HTML (English master), parsed with fidelity asserts (12 units / 108 exercises / 275 glossary) | `course_source.html`, `lib/course.ts`, `lib/courses.ts` |
| **Course i18n engine** | **Shipped (Phase 2).** Spine vs teaching-layer split: `extractCatalog`/`localizeCourse`; `getCourseContent(slug, medium)` (en = source, untouched; others overlay a translation file with English fallback). 923-key English catalog generated. **Medium *selection/rendering* not wired yet** (Phase 3). | `lib/i18n-course.ts`, `lib/content.ts`, `i18n/catalan-a1.en.json`, `app/api/admin/i18n/[slug]/route.ts`, `tests/unit/i18n-course.test.ts` |
| Audio | Shared Catalan library: native (Lingua Libre) + Google TTS, static MP3s; admin overrides via Supabase Storage | `public/audio/ca/`, `lib/native-audio.json`, `lib/tts-audio.json`, `lib/speech.ts`, `scripts/fetch-native-audio.mjs`, `scripts/generate-tts.mjs` |
| Exercise engine | 10 written + 3 audio types (`listen`, `dictation`, `listenmatch`); audio types are **h4-detected** (no `EX_TYPES` entry) | `components/exercises.tsx`, `lib/types.ts`, `lib/course.ts` |
| Admin audio | Record/upload overrides (in-browser → MP3 via lamejs); override wins at runtime | `app/admin/audio/`, `components/admin/AudioManager.tsx`, `lib/audio-overrides.ts`, `lib/to-mp3.ts`, migration `0004` |
| **Localized marketing** | `/ca /es /fr /ru` home + course landings (static, hreflang, localized `Course`/FAQ schema). **Funnel to the English-taught course.** | `lib/i18n.ts`, `app/{ca,es,fr,ru}/`, `components/marketing/`, `components/{SiteHeader,HeaderNav,SiteFooter,AccountSlot,LangSwitcher}.tsx` |
| SEO | metadata + OG image, sitemap, robots, JSON-LD (Org/Course/FAQ), hreflang | `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `components/JsonLd.tsx` |
| Perf | Marketing/legal/localized pages prerender **static** (header account state is client-side via `AccountSlot`); audio manifest lazy-loaded | see §4 |

**What is NOT done yet:** the course itself is English-medium only. The
localized pages are *marketing* that say "taught in English." Turning the
*course content* multilingual is the work this doc plans (§5–§6).

---

## 2. Audio architecture (shared Catalan library)

### Model
Audio is a **flat, course-agnostic library keyed by the normalized Catalan
text** (`nativeKey(text)` from `lib/native-audio-key.ts`). Any level, any medium
looks up the same file by the Catalan word. Adding A2 adds *new* words (new
files); adding a medium adds **zero** audio.

### Runtime priority (`lib/speech.ts` → `speak()`)
1. **Admin override** (recorded/uploaded) — wins, instant, needs no manifest.
2. **Native recording** (Lingua Libre, CC BY-SA — credited on the glossary).
3. **Google TTS** (`ca-ES-Standard-B`; pre-generated static MP3s).
4. Browser Web-Speech TTS — last-ditch only (often missing/wrong on devices).

Manifests (`native-audio.json`, `tts-audio.json`) are **lazy-loaded** as a chunk
(not in the main course bundle), warmed via `preloadAudio()`.

### Storage today
- **Bulk** (~600 MP3s): committed in `public/audio/ca/`, served by Vercel CDN
  (public, immutable, content-hash filenames).
- **Admin overrides:** public Supabase Storage bucket `course-audio` + the
  `audio_overrides` table (metadata only — **never bytes in Postgres**).

### Why the bucket is **public**
The audio is play-for-everyone content (incl. logged-out free preview), CDN-fast
with a plain `<audio src>`, and consistent with the already-public `/public`
MP3s. The paywall protects the *course experience* (pages/exercises/grading),
not raw asset URLs. Truly gating audio = private bucket + signed URLs for ALL
audio + a per-user dynamic manifest — real speed/complexity cost for low value
(raw clips without the course are not the product). Not recommended now.

### Scaling plan (do later, ~A2+ or when git/audio mgmt hurts)
Committing MP3s is fine now (10 MB). When volume/management demands it
(several levels, lots of recordings, deploy-free editing), move **all** audio to
the `course-audio` bucket **with a CDN in front** so Supabase egress stays ~0:
- **Preferred: Cloudflare** (already our DNS) — serve audio from
  `audio.verbadium.com` (proxied) → Cloudflare caches at edge (free egress) →
  Supabase origin hit only on cold miss. `Cache-Control: public, immutable` is
  safe because filenames are content-hashed.
- **Override cache-busting:** overrides replace a file at the same path → version
  the path (include `updated_at`) so the CDN serves fresh.
- `fetch-native-audio.mjs` / `generate-tts.mjs` would upload to the bucket
  instead of committing; manifests store bucket/CDN URLs.
- This is **cost-neutral vs `/public`** once cached — the win is management, not
  cost or security.

### Security / abuse notes
- A public bucket is as scrapable as `/public`; moving to a bucket does **not**
  improve protection.
- Cheap real mitigation if wanted: ship a **free-only manifest to non-owners**
  (don't hand the full URL list to free-preview visitors; owners get the full
  manifest) — keeps full CDN speed, stops casual bulk scraping. Filenames are
  content-hashes so "not listed" ≈ not findable.
- DDoS/egress is a **CDN/WAF** concern (Vercel Firewall rate-limits), **not**
  bucket privacy.

---

## 3. Multilingual course architecture (PLANNED)

Goal: teach each level in many mediums **without duplicating** the Catalan spine
or audio, and without copy-pasting whole courses.

### 3.1 Product / commerce model
- **One Paddle product per level** (`catalan-a1`, later `catalan-a2`). The medium
  is a **UI/presentation preference**, not a SKU. One purchase unlocks the level
  in **every** medium. (Avoids catalog/pricing fragmentation; the localized
  landing pages already exist per language.)
- Medium is chosen by the learner (and pre-set when they arrive from a localized
  landing page). Store as a preference (cookie + account setting).

### 3.2 Content split: **spine** vs **teaching layer**
Per **level**, separate:
- **Spine (language-neutral, authored once):** units & blocks; the Catalan
  strings (vocab `ca`, dialogue Catalan lines, gap sentences' Catalan, reorder
  tokens, Catalan answers), IPA, exercise **types + answer keys**, audio keys.
  This is what makes it "Catalan A1," identical across mediums.
- **Teaching layer (per level × medium):** everything in a human explanation
  language — unit theory/prose, `can-do` statements, exercise **titles &
  instructions**, the glossary **meaning** column, dialogue **glosses**,
  translate-into-Catalan **prompts**, listen→meaning **answers**, IPA-guide &
  exam-info prose, UI strings.

`Course(level, medium) = merge(spine[level], teaching[level][medium])`.

### 3.3 Authoring & translation flow
- **Author the master in ONE medium (English)** — the current `course_source.html`
  already interleaves Catalan + English naturally. Keep authoring there.
- The build **extracts**:
  - the **spine** (Catalan + structure), and
  - the **English teaching layer** as a translation catalog with **stable keys**:
    `i18n/<level>.en.json` (key → English string) — the source of truth.
- Translators (human or LLM-assisted) produce `i18n/<level>.<medium>.json`.
  Missing keys **fall back to English** (and are flagged in dev/CI).
- At render, `getCourse(level, medium)` applies the medium overlay onto the spine.

### 3.4 Translatable-string keying (the tricky bits)
- Unit prose block → `u<unit>.prose.<n>`; `can-do` → `u<unit>.cando`.
- Exercise title `<h4>` + note → `ex.<id>.title`, `ex.<id>.note`.
- Glossary/vocab `<span class="en">` gloss → keyed by **Catalan text**
  (`gloss.<nativeKey>`) so a word's translation is reused everywhere it appears.
- Dialogue gloss `<p class="gloss">` → `dlg.<unit>.<n>`.
- Answer-key human-language parts (`translate`/`model`/`free`/`listen`) → keyed.
- IPA guide & exam-info prose → keyed blocks.
- **Prose blocks contain inline Catalan** (`<span class="ca">…</span>`): the
  translation unit is the block HTML **with the Catalan spans preserved** —
  translators translate *around* the Catalan. Do not strip/translate `.ca`.
- The Catalan itself (`td.ca`/`span.ca`, gap Catalan, reorder tokens, Catalan
  answers, IPA) is **spine — never translated**.

### 3.5 Fidelity guards (extend the existing pattern)
- Spine: per-level counts (units/exercises/glossary), as today.
- Each medium's `i18n/<level>.<medium>.json`: CI check for **missing/extra keys**
  vs the `.en.json` source, so drift is caught (mirrors the 108-exercises assert).

### 3.6 Routing & UX
- Course **app** pages: medium via preference (cookie/account); the existing
  localized landing pages set it and funnel in. Keep `/courses/<level>/…`.
- For SEO of *free* content, optionally expose localized free-unit URLs
  (`/<medium>/…`) like the landing pages. Gated pages don't need per-medium URLs.
- The `lib/i18n.ts` dictionary already covers the **shell/marketing**; the course
  teaching layer is a separate, larger catalog (per level).

### 3.7 Anti-patterns (do NOT do)
- ❌ Copy `course_source.html` per medium (maintenance explosion; Catalan drift).
- ❌ Key audio or the spine per course/medium (breaks sharing).
- ❌ A separate Paddle product per medium (commerce fragmentation).
- ❌ Storing audio bytes in Postgres.

---

## 4. Performance notes (shipped + principles)

- **Static where possible:** marketing/legal/localized pages prerender static;
  the header's account state is resolved client-side (`AccountSlot`) so
  `SiteHeader` no longer reads the session on the server. Keep new
  marketing/content pages static — don't read cookies/session server-side in
  them; resolve per-user bits client-side or via a dynamic island.
- Dynamic (correctly): `/`, `/pricing`, `/account`, `/admin`, the course app
  (per-user data).
- **Lazy/limit client JS:** audio manifests load as a chunk (warmed on mount);
  `AudioCredits` takes names as a prop (no JSON in client). Apply the same
  discipline to future data blobs.
- Next step if needed: ISR/PPR for course *content* pages; Vercel Speed Insights
  for real Core Web Vitals.

---

## 5. Roadmap / phases

- **Phase 0 — done:** shared audio library; admin overrides; 3 audio exercise
  types; SEO; **localized marketing landing pages** (ca/es/fr/ru); perf (static
  pages, lazy audio).
- **Phase 2 — spine/teaching engine — DONE (did this before A2).** `lib/i18n-course.ts`
  (`extractCatalog`/`localizeCourse`), `getCourseContent(slug, medium)` (en =
  source/untouched; others overlay with English fallback), `i18n/catalan-a1.en.json`
  (923 keys), admin extract route, lossless-roundtrip unit tests. English
  rendering unchanged.
- **Phase 3 — wire medium + first non-English medium — DONE (content):**
  (a) medium selection via `vb-medium` cookie (`getMedium`, gated by
  `AVAILABLE_MEDIUMS`), threaded into all course pages; `MediumSwitcher` +
  `SetMedium`. (b) `i18n/catalan-a1.es.json` — full 923-key Spanish translation
  (generated by parallel Claude translators; validated: key parity + HTML +
  Catalan-span integrity; CI-guarded). **Spanish is live, opt-in** (`es` in
  `AVAILABLE_MEDIUMS`; English remains default). Course content (lessons,
  exercises, glossary, exam) renders Spanish, Catalan spine intact.
  - **Remaining for a fully-Spanish experience (Phase 3.1, next):**
    1. **App-chrome i18n** — component strings are still English (Sidebar nav,
       exercise buttons "Check answers"/"Show correct answers", the free-preview/
       paywall banner, "Get the full course", account menu). These are client
       components → needs a course-locale provider + a small UI dictionary
       (~30–50 strings). Separate from the content catalog.
    2. **Native review** of the AI Spanish draft before heavy marketing.
  - (c) then **fr/ru** = run the same translator fan-out on the catalog (+ the
    chrome dict) and add to `AVAILABLE_MEDIUMS`.
- **Phase 1 (later) — A2 content:** author Catalan A2 (English master). Add
  `catalan-a2` to `lib/courses.ts` (+ content source in `lib/content.ts` +
  `PADDLE_PRICE_CATALAN_A2`). Audio auto-shares via the text-keyed library; run
  `npm run audio:native` + `audio:tts` for new words. Then generate its `.en`
  catalog and translate per medium. (Can come after Phase 3 — order is flexible.)
- **Phase 4 — audio to bucket + Cloudflare** (if volume/management demands).

## How to add a teaching medium (Phase 3 recipe)
1. **Get the English catalog:** `i18n/<slug>.en.json` (committed). Regenerate
   after content changes via the admin route `GET /api/admin/i18n/<slug>` (signed
   in as an admin) → save over the file.
2. **Translate:** copy it to `i18n/<slug>.<medium>.json` and translate the
   **values**. Keep the **keys** and any inline Catalan (`<span class="ca">…`,
   IPA, Catalan words) intact — translate the surrounding teaching text only.
   Missing keys fall back to English automatically.
3. **Render:** `getCourseContent(slug, medium)` already applies it. What's left
   (Phase 3a) is choosing the `medium` per visitor and threading it into the
   course layout/pages (today they default to `'en'`).
4. **Guardrail:** add a CI check that every `<slug>.<medium>.json` has the same
   key set as `<slug>.en.json` (catches drift), mirroring the fidelity asserts.

---

## 6. Key decisions & rationale (this session)

1. **Audio is a shared, text-keyed Catalan library** (native > TTS > admin
   override). Mediums add no audio; levels add new words. Never per-course keyed.
2. **Medium = presentation, not a product.** One price per level unlocks all
   mediums.
3. **Spine vs teaching layer** split for course i18n; author master in English,
   overlay translations by key. Never copy courses per medium.
4. **Audio storage:** static `/public` now; bucket + **Cloudflare** cache later
   (cost-neutral). **Public** bucket (consistent, fast); the paywall guards the
   experience, not asset URLs. **Never** store audio bytes in Postgres.
5. **Admin overrides:** Supabase Storage (public, CDN) + metadata table; in-browser
   recordings converted to MP3 (iOS-safe) client-side.
6. **Static marketing/legal pages** via client-side account header — the perf win;
   keep new public pages static.
7. **Security posture:** raw audio is low-value alone; if scraping matters, use a
   free-only manifest for non-owners + Vercel Firewall — not a private bucket.

---

## 7. Quick pointers
- Content pipeline & fidelity: `DESIGN.md`, `DECISIONS.md`.
- Audio scripts: `npm run audio:native` then `npm run audio:tts` (when course
  text changes). Admin recordings: `/admin/audio`.
- Marketing i18n strings: `lib/i18n.ts`. Add a language = one dict entry + two
  thin route files (see `app/ru/`).
- Adding a course/level: `lib/courses.ts` + content source in `lib/content.ts` +
  `PADDLE_PRICE_<SLUG>` env var.
