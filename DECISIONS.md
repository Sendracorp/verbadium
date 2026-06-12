# DECISIONS

Decisions made while building the site, and why.

1. **Generator script + static output, not runtime parsing.** The brief bans
   frameworks/build-steps for the *site*; generating pages once with
   `node build.js` keeps the served artifact plain HTML/CSS/JS while letting
   us assert content fidelity (12/83/275) at build time instead of trusting
   hand-copied content.

2. **Zero-dependency parser.** The source HTML is machine-regular, so a
   ~40-line depth-counting tag scanner replaces cheerio/jsdom. No
   `node_modules` needed to rebuild the site.

3. **`data.js` over `fetch`-ed JSON.** `fetch()` is blocked on `file://`
   (CORS), and the goal requires the site to work when opened as a local
   file. A global `window.CAT` script tag works everywhere.

4. **Every exercise id hard-coded in `EX_TYPES`.** 83 exercises were
   classified by hand into 10 interaction types. An explicit table makes the
   classification reviewable and turns any source drift into a build failure
   rather than a silently broken exercise.

5. **Answer-key parsing with per-exercise overrides.** The key is prose
   (“1) soc 2) ets …”, “set · catorze · …”). Mechanical splitting covers 81
   exercises; `6.2`/`6.3` (where the key embeds the noun: “el meu germà” for
   gap “___ germà”) are curated in `ANSWER_OVERRIDES`. Count assertions
   guard every parse.

6. **Accent-lenient marking shown as amber, scored as correct.** The brief
   says “accept answers without accents but gently flag”. Counting them
   correct keeps motivation up at A1 while the amber “check the accents!”
   nudge teaches the orthography.

7. **Error-correction & translation are self-marked, not auto-marked.**
   Free translations have many valid variants; auto-marking would mark good
   Catalan wrong. Per the brief these show the model answer with per-item
   “I got it / Not yet” buttons (which also gives partial scores).

8. **Speech buttons are *not* injected inside exercises.** EX 1.2/9.7/10.6…
   ask the learner to read IPA and produce the word; a 🔊 button there would
   read out the answer. Theory tables, phrase lists, dialogues and the
   glossary all get buttons.

9. **TTS fallback is a notice, not a blocker.** If no `ca` voice exists we
   still attempt speech with `lang=ca-ES` (some engines synthesise without a
   named voice) and show a one-time dismissible notice pointing to Forvo’s
   native recordings, as the brief requires.

10. **Mock timers soft-stop.** At 0 the display turns red and keeps counting
    negative; the attempt records `over time` per paper but never blocks
    finishing — matching the brief and real-world practice value.

11. **Progress restores state, not input values.** Per-exercise
    state/score/timestamp persist; typed answers don’t. This keeps storage
    tiny and makes “Retry” semantics obvious. The mock exam’s saved history
    is the durable record there.

12. **Sidebar → hamburger at 860 px; tables scroll horizontally ≤ 480 px.**
    Vocabulary tables with three columns (CA/IPA/EN) are the widest content;
    letting them scroll inside the card beats squashing IPA into wrapping
    soup on a 380 px phone.

13. **QA uses Playwright in a git-ignored sandbox (`qa/node_modules`).**
    The site itself stays dependency-free; the test harness needs a real
    browser to click exercises, test localStorage and the 380 px viewport.
    The test script and its `package.json` are committed, the heavy deps are
    not.

14. **Pages deploy = main branch root.** The generated site lives at the
    repo root (with `.nojekyll`), so GitHub Pages “deploy from branch /
    root” serves it with zero configuration and all-relative paths keep
    `file://` working from a clone.

---

## Platform decisions (login, payments, multi-course — June 2026)

15. **Supabase for auth + database.** Email/password (verification +
    password reset included) plus Google OAuth are dashboard toggles, and
    the same project hosts Postgres for purchases/progress. Chosen over
    Auth.js (credentials auth is deliberately bare-bones there) and Clerk
    (extra vendor for a feature Supabase bundles). All tables carry
    row-level security; users only ever see their own rows.

16. **Lemon Squeezy as merchant of record.** They handle EU VAT and global
    sales tax — worth the higher fee (~5% + 50¢) at a $5 price point versus
    running tax compliance on Stripe. The webhook
    (`/api/webhooks/lemonsqueezy`, HMAC-verified, idempotent on order ID) is
    the **only** writer of `purchases`; refunds revoke access.

17. **One-time purchase per course, no subscriptions in v1.** The
    `purchases` table is per-course rows, so an all-access subscription can
    later be modelled as additional grant rows without schema rework.

18. **Free preview = unit 1 + IPA guide + exam info; everything else gated.**
    Gating happens server-side in the page components (the paywall is
    rendered instead of content — nothing gated reaches the client).
    `COURSE_BYPASS_PAYWALL=true` exists for the content QA suite only.

19. **Course-scoped URLs.** `/courses/[slug]/…` with permanent redirects
    from the old root paths. The catalog (`lib/courses.ts`) is metadata
    only; `lib/content.ts` maps slug → parsed content, so course pages stay
    generic.

20. **Progress keeps its localStorage API, swaps the backend.** The exercise
    engine still calls `sget/sset/exState`; when logged in the store is an
    in-memory cache seeded server-side and pushed to Supabase through a
    retrying, latest-write-wins queue (optimistic UI on the exercise hot
    path). Logged-out preview progress stays in localStorage — there were no
    existing users, so no migration. `mock.conditions` remains a device
    preference.

21. **The app must run with placeholder credentials.** Unconfigured Supabase
    short-circuits to "logged out" (paywall active, auth pages explain
    themselves) instead of crashing — so the repo builds, deploys and QA-runs
    before any account is created. Auth-dependent routes are
    `force-dynamic` so a placeholder build never freezes that state.
