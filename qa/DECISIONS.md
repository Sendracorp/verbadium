
## TypeScript / Next.js migration (June 2026)

15. **Next.js App Router + SSG, no static export.** The user connects the
    repo to Vercel, which runs `next build` natively; all routes prerender
    via `generateStaticParams`, so the site is still effectively static.
    Dropping `output: 'export'` keeps the door open for API routes later.
    (This supersedes the GitHub Pages + `file://` requirements of the
    vanilla version — decisions 3 and 14 above are historical.)

16. **The parser became `lib/course.ts` and runs inside `next build`.** The
    fidelity assertions (12 units / 83 exercises / 275 glossary rows / 15
    checklist items) now fail the production build itself — stronger than
    the old separate build script.

17. **Theory HTML is rendered verbatim, enhanced after mount.** Course
    tables/dialogues/resource boxes pass through `dangerouslySetInnerHTML`
    (trusted, same-repo source) inside `SpeechScope`, which injects 🔊
    buttons and dialogue players in an effect. Rewriting hundreds of theory
    blocks as JSX would risk the content fidelity the brief demands.

18. **Exercises are real React components.** Interactive state (inputs,
    matching, reorder chips, self-marks, timers) is controlled React state
    in `components/exercises.tsx` and `components/Mock.tsx` — no DOM
    poking — while keeping the original class names so the CSS and the
    Playwright QA suite carried over nearly unchanged.

19. **localStorage is read only after hydration.** Server HTML renders
    zero-progress; components flip a `hydrated` flag in `useEffect` before
    reading storage, then a tiny pub/sub (`lib/progress.ts`) re-renders
    badges/dashboard on every change. This avoids React #418 hydration
    mismatches that direct reads caused.
