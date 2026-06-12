# Català from Scratch — interactive course platform

An interactive course platform for learning Catalan, currently offering a
complete beginner's course in Central Catalan (CEFR A1) built to prepare for
the official A1 exam (*Certificat de nivell inicial de català*).
**Next.js + TypeScript + React + Supabase + Lemon Squeezy**, deployable on Vercel.

* a **course catalog** with per-course purchase (one-time, ~$5) — unit 1 of
  each course is a **free preview**, no account needed
* **accounts**: email/password (with verification + password reset) and
  Google login via Supabase Auth
* **payments** through Lemon Squeezy as merchant of record (they handle EU
  VAT / global sales tax); access granted by signed webhook
* **progress tracking in your account**: per-exercise states, per-unit bars,
  mock-exam attempt history, "continue where you left off" — synced across
  devices (logged-out preview progress stays in localStorage)
* **12 units** of theory, vocabulary (300+ words, every one with IPA),
  dialogues and verified external resources
* **83 interactive exercises** auto-marked from the course answer key
* 🔊 **audio on every Catalan word, phrase and dialogue line** via the Web
  Speech API (prefers a `ca-ES` voice)
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
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy API key (Settings → API) |
| `LEMONSQUEEZY_STORE_ID` | Numeric store ID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Signing secret of the webhook below |
| `LEMONSQUEEZY_VARIANT_CATALAN_A1` | Variant ID of the $5 course product (one var per course slug) |
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

## Lemon Squeezy setup (one-time)

1. Create a store (test mode works immediately; going live requires their
   store review since they are the merchant of record).
2. Create a product "Catalan A1" at $5 → copy the **variant ID** into
   `LEMONSQUEEZY_VARIANT_CATALAN_A1`.
3. Settings → API → create an API key.
4. Settings → Webhooks → add
   `https://<your-domain>/api/webhooks/lemonsqueezy`, subscribe to
   `order_created` and `order_refunded`, set a signing secret and copy it
   into `LEMONSQUEEZY_WEBHOOK_SECRET`.
5. Test-mode checkout uses card `4242 4242 4242 4242`. Refunding an order in
   the LS dashboard revokes course access via the webhook.

## Source of truth

Course content lives in `course_source.html`. Pages are generated from it at
build time by `lib/course.ts`, which **asserts content fidelity** — exactly
12 units, 83 exercises and 275 glossary rows — and fails the build if the
source drifts. The catalog itself is `lib/courses.ts`; adding a course means
adding an entry there, a content source wired in `lib/content.ts`, and a
`LEMONSQUEEZY_VARIANT_<SLUG>` env var. See `DESIGN.md` for architecture and
`DECISIONS.md` for the choices made.

## Deploy on Vercel

Import the GitHub repo at <https://vercel.com/new> (or `vercel link` +
`vercel deploy`). Vercel auto-detects Next.js. Add the environment variables
above; course pages are server-rendered per request (auth + ownership), so
no extra configuration is needed.

## QA suites

```sh
npm run build

# 1) content & exercises (server with the paywall bypassed)
COURSE_BYPASS_PAYWALL=true npx next start -p 3411 &
cd qa && npm install && node test.js http://localhost:3411/

# 2) paywall gating, redirects, auth pages (normal server, placeholder creds fine)
npx next start -p 3412 &
cd qa && node gating.test.js http://localhost:3412/
```

`test.js` click-tests one exercise of every type, audio wiring, persistence
across reloads, the mock exam and a 380 px mobile viewport. `gating.test.js`
verifies the catalog, old-URL redirects, the free preview, that every gated
page shows the paywall with no leaked content, that `/api/checkout` requires
login and the webhook rejects unsigned payloads, and the auth pages.
