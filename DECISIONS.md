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
