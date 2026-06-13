# Català from Scratch — interactive course platform

An interactive course platform for learning Catalan, currently offering a
complete beginner's course in Central Catalan (CEFR A1) built to prepare for
the official A1 exam (*Certificat de nivell inicial de català*).
**Next.js + TypeScript + React + Supabase + Paddle**, deployable on Vercel.

* a **course catalog** with per-course purchase (one-time, ~$5) — unit 1 of
  each course is a **free preview**, no account needed
* **accounts**: email/password (with verification + password reset) and
  Google login via Supabase Auth
* **payments** through Paddle as merchant of record (they handle EU VAT /
  global sales tax, and support Andorra-based sellers); access granted by
  signed webhook
* **progress tracking in your account**: per-exercise states, per-unit bars,
  mock-exam attempt history, "continue where you left off" — synced across
  devices (logged-out preview progress stays in localStorage)
* **12 units** of theory, vocabulary (300+ words, every one with IPA),
  dialogues and verified external resources
* **83 interactive exercises** auto-marked from the course answer key
* 🔊 **audio on every Catalan word, phrase and dialogue line** — vocabulary
  uses **native-speaker recordings** (Lingua Libre / Wikimedia Commons,
  CC BY-SA 4.0, shipped as static MP3s); sentences and dialogues fall back
  to the Web Speech API (prefers a `ca-ES` voice)
* a full **mock A1 exam** — TTS listening paper, optional exam-condition
  timers, auto-marking, attempt history
* a searchable, sortable **glossary** (275 entries)
* a minimal **/admin** view (students, purchases, gross revenue) for accounts
  with `profiles.is_admin = true`

## Run it locally

```sh
npm install
cp .env.example .env.local   # fill in real values, or leave placeholders
npm run dev                  # http://localhost:3000
```

With placeholder credentials the site runs in a degraded-but-safe mode:
everyone is logged out, the paywall is active (unit 1 + IPA guide + exam info
stay free), auth pages explain that accounts aren't enabled, and checkout
returns a friendly error.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **server only**; used by the webhook and /admin |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` while testing, `production` to go live |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle client-side token (Developer Tools → Authentication; safe to expose) |
| `PADDLE_WEBHOOK_SECRET` | Secret key of the notification destination below |
| `PADDLE_PRICE_CATALAN_A1` | Price ID (`pri_…`) of the $5 course product (one var per course slug) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for auth + checkout redirects |
| `COURSE_BYPASS_PAYWALL` | `true` unlocks everything — **local QA only, never in production** |

Set them on Vercel with `vercel env add` (or the dashboard) for Production +
Preview, then redeploy.

## Supabase setup (one-time)

1. Create a project at <https://supabase.com>.
2. SQL editor → run `supabase/migrations/0001_init.sql` (tables, signup
   trigger, row-level security).
3. Authentication → URL Configuration: set the Site URL to your domain and
   add `https://<your-domain>/auth/callback` (and the localhost equivalent)
   to the redirect allow-list.
4. Authentication → Providers: Email is on by default (leave "Confirm email"
   enabled); enable **Google** and paste the OAuth client ID/secret from
   Google Cloud Console (authorized redirect URI:
   `https://<project>.supabase.co/auth/v1/callback`).
5. Make yourself admin: `update public.profiles set is_admin = true where email = 'you@…';`

Row-level security: students can only read/write their own progress and read
their own purchases; the `purchases` table is written exclusively by the
webhook through the service-role key.

## Paddle setup (one-time)

Paddle is the merchant of record (handles EU VAT / global sales tax) and —
unlike Stripe or Lemon Squeezy — supports sellers based in Andorra. Start in
the **sandbox** (<https://sandbox-vendors.paddle.com>, instant signup); going
live requires Paddle's seller verification of your real account + website.

1. Create a product "Catalan A1" with a one-time $5 price → copy the
   **price ID** (`pri_…`) into `PADDLE_PRICE_CATALAN_A1`.
2. Developer Tools → Authentication → create a **client-side token** →
   `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (and set `NEXT_PUBLIC_PADDLE_ENV`).
3. Developer Tools → Notifications → add a destination
   `https://<your-domain>/api/webhooks/paddle`, subscribe to
   `transaction.completed`, `adjustment.created` and `adjustment.updated`,
   and copy its **secret key** into `PADDLE_WEBHOOK_SECRET`.
4. Checkout settings → add your domain(s) to the approved domains so the
   overlay checkout and `successUrl` work.
5. Sandbox checkout uses card `4242 4242 4242 4242` (any future expiry/CVC).
   Approving a refund in the Paddle dashboard revokes course access via the
   webhook. Payouts: SEPA/SWIFT bank transfer or Payoneer.

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

Course content lives in `course_source.html`. Pages are generated from it at
build time by `lib/course.ts`, which **asserts content fidelity** — exactly
12 units, 83 exercises and 275 glossary rows — and fails the build if the
source drifts. The catalog itself is `lib/courses.ts`; adding a course means
adding an entry there, a content source wired in `lib/content.ts`, and a
`PADDLE_PRICE_<SLUG>` env var. See `DESIGN.md` for architecture and
`DECISIONS.md` for the choices made.

## Deploy on Vercel

Import the GitHub repo at <https://vercel.com/new> (or `vercel link` +
`vercel deploy`). Vercel auto-detects Next.js. Add the environment variables
above; course pages are server-rendered per request (auth + ownership), so
no extra configuration is needed.

## Tests

Two layers, both TypeScript (`tests/`):

- **Vitest** (`tests/unit/`) — pure logic, no browser: answer-checking
  (`lib/check.ts`), the catalog, and native-audio key matching + manifest
  integrity (every referenced MP3 exists). Milliseconds to run.
- **Playwright Test** (`tests/e2e/`) — real-browser flows against a dev
  server it starts itself (`webServer` in `playwright.config.ts`):
  - `gating.spec.ts` — logged-out: catalog, old-URL redirects, free preview,
    every gated page paywalled with no leaked content, `/api/checkout` 401,
    unsigned-webhook 401, auth pages, 380 px mobile. **Needs no Supabase.**
  - `auth.spec.ts` + `content.spec.ts` — log in as a real course-owning test
    user (created/torn down via the Supabase admin API in a worker fixture),
    then exercise every question type, the glossary + native audio, the mock
    exam, the IPA drawer, mobile, and verify progress round-trips through the
    database. These **skip automatically** when `.env.local` has placeholder
    Supabase credentials.

```sh
npm test            # unit + e2e
npm run test:unit   # Vitest only (fast, no browser, no Supabase)
npm run test:e2e    # Playwright only
npm run test:e2e:ui # Playwright interactive UI
```

First run needs the browser: `npx playwright install chromium`. The e2e
suite runs against a **normal** server (no `COURSE_BYPASS_PAYWALL`) — gated
content is reached by logging in a real owner, so the actual access path is
what gets tested.

## Roadmap

- [ ] **Sentence/dialogue audio**: the 237 texts in `recordings/TODO.txt`
      still use browser TTS. Either record them with a native speaker
      (drop files in `recordings/` + `index.json`, re-run
      `scripts/fetch-native-audio.mjs`) or pre-generate static MP3s with
      Azure neural Catalan TTS (`ca-ES-JoanaNeural` / `EnricNeural` /
      `AlbaNeural`, free tier covers the whole course) once an Azure
      Speech key exists.
