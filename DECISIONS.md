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

15. **Native-speaker audio over TTS, sourced from Lingua Libre.** Browser TTS
    pronounces Catalan badly on most devices — unacceptable for a
    pronunciation-focused course. Forvo (real speakers) forbids caching and
    requires a commercial API agreement; Lingua Libre's ~23k Catalan
    recordings on Wikimedia Commons are CC BY-SA 4.0, so they are fetched
    once (`scripts/fetch-native-audio.mjs`), committed as static MP3s and
    attributed on the glossary page. Coverage: every whole-entry match plus
    multi-word entries whose every part is recorded (played in sequence) —
    roughly half of all speakable strings, including most single-word
    vocabulary. Sentences/dialogues keep the Web Speech fallback; recordists
    are ranked by recording count so one voice dominates for consistency.

---

## Platform decisions (login, payments, multi-course — June 2026)

16. **Supabase for auth + database.** Email/password (verification +
    password reset included) plus Google OAuth are dashboard toggles, and
    the same project hosts Postgres for purchases/progress. Chosen over
    Auth.js (credentials auth is deliberately bare-bones there) and Clerk
    (extra vendor for a feature Supabase bundles). All tables carry
    row-level security; users only ever see their own rows.

17. **Paddle as merchant of record** (originally Lemon Squeezy, swapped the
    same week). A MoR handles EU VAT and global sales tax — worth the higher
    fee at this price point versus running tax compliance yourself. Lemon
    Squeezy turned out not to support Andorra-based sellers (it's Stripe-owned
    and Stripe doesn't operate in Andorra; Polar fails the same way via
    Stripe Connect). Paddle supports Andorran sellers, allows self-authored
    online courses, and pays out via SEPA/SWIFT or Payoneer. The webhook
    (`/api/webhooks/paddle`, HMAC-verified, idempotent on the transaction ID)
    is the **only** writer of `purchases`; approved refunds revoke access.
    Checkout is Paddle.js overlay (client-side) gated by `/api/checkout`.

18. **One-time purchase per course, no subscriptions in v1.** The
    `purchases` table is per-course rows, so an all-access subscription can
    later be modelled as additional grant rows without schema rework.

19. **Free preview = unit 1 + IPA guide + exam info; everything else gated.**
    Gating happens server-side in the page components (the paywall is
    rendered instead of content — nothing gated reaches the client).
    `COURSE_BYPASS_PAYWALL=true` exists for the content QA suite only.

20. **Course-scoped URLs.** `/courses/[slug]/…` with permanent redirects
    from the old root paths. The catalog (`lib/courses.ts`) is metadata
    only; `lib/content.ts` maps slug → parsed content, so course pages stay
    generic.

21. **Progress keeps its localStorage API, swaps the backend.** The exercise
    engine still calls `sget/sset/exState`; when logged in the store is an
    in-memory cache seeded server-side and pushed to Supabase through a
    retrying, latest-write-wins queue (optimistic UI on the exercise hot
    path). Logged-out preview progress stays in localStorage — there were no
    existing users, so no migration. `mock.conditions` remains a device
    preference.

22. **The app must run with placeholder credentials.** Unconfigured Supabase
    short-circuits to "logged out" (paywall active, auth pages explain
    themselves) instead of crashing — so the repo builds, deploys and QA-runs
    before any account is created. Auth-dependent routes are
    `force-dynamic` so a placeholder build never freezes that state.

23. **Tests: Vitest + Playwright Test, TypeScript (replacing the hand-rolled
    Playwright scripts).** The original `qa/*.js` used the raw `playwright`
    library with a custom `ok()` helper. Researched the 2026 consensus and
    migrated to the two-layer stack the Next.js team itself uses: Vitest for
    pure logic (no browser) and Playwright Test for browser flows — gaining
    per-test isolation, parallelism, retries, fixtures and HTML reports.
    Notably this let the e2e suite drop the `COURSE_BYPASS_PAYWALL` crutch:
    gated content is now reached by logging in a real course-owning user
    created/torn down via the Supabase admin API in a worker fixture, so the
    true access path is tested. Supabase-dependent specs `test.skip` when
    credentials are placeholders; the logged-out gating spec always runs.
    (Supersedes decision 13.)

24. **Price source of truth = Paddle (live), shown provably in admin.** The
    amount displayed on the catalog, course page, pricing page and paywall is
    read live from the Paddle price API (`PADDLE_API_KEY`, cached 1h) via
    `lib/pricing.ts`, so the shown price can never desync from what's charged.
    The catalog `priceLabel` (€70) is only a fallback for when Paddle isn't
    wired up. The admin dashboard shows each course's resolved price, its
    source (Paddle vs fallback) and the Paddle price ID, making the source of
    truth auditable. Prices are *edited in Paddle*, not in our admin — an
    in-app editor could write a price that disagrees with the real charge, so
    it's deliberately read-only.

25. **Pricing + legal pages for Paddle verification.** Paddle's domain review
    requires Terms, Refund Policy and Privacy Policy reachable from navigation,
    the legal name in the Terms, a pricing page, and HTTPS. A support email is
    enough for buyer contact — phone and physical address are NOT on Paddle's
    checklist, so in `lib/site.ts` they're optional and the pages omit them
    when empty (only `legalName` + `email` are needed; legalName is still a
    placeholder to set before launch). Added `/pricing`, `/terms`, `/refunds`,
    `/privacy`, `/contact`, linked from a `SiteFooter` on every public page and
    the course layout. Refund policy: **all sales final / no refunds** (owner
    decision). Legal for immediately-delivered digital content because the
    buyer consents to immediate access + waives the 14-day EU withdrawal right
    at Paddle checkout; the free preview is the try-before-you-buy. Keeps a
    minimal carve-out for faulty/undelivered content + duplicate charges
    (statutory, can't be waived) — and Paddle may still refund chargebacks/
    fraud regardless. (Earlier iterations tried a 14-day guarantee, then a
    progress-gated 14-day refund; owner chose strict all-sales-final.) Not
    legal advice — review before launch.

26. **Platform rebrand → Verbadium.** Bought verbadium.com; the platform
    (header, footer, catalog, metadata, legal pages, email sender) is now
    "Verbadium" via `SITE.brand`, while each course keeps its own name
    ("Catalan from Scratch (A1)" in `lib/courses.ts`). The in-course sidebar
    shows the Verbadium brand + course label (language · level). Course content
    is untouched.
