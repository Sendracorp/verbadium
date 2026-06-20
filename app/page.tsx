import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

// Auth/ownership state must be evaluated per request, even when the build
// runs with unconfigured placeholder credentials.
export const dynamic = 'force-dynamic';

import BuyButton from '@/components/BuyButton';
import { COURSES } from '@/lib/courses';
import { getSessionUser, paywallBypassed, userOwnsCourse } from '@/lib/access';
import { countPassedExercises } from '@/lib/progress-server';
import { resolveCoursePrice } from '@/lib/pricing';

export default async function CatalogPage() {
  const user = await getSessionUser();
  const cards = await Promise.all(COURSES.map(async meta => {
    const owns = meta.available && (paywallBypassed() || (user ? await userOwnsCourse(user.id, meta.slug) : false));
    const passed = owns && user ? await countPassedExercises(user.id, meta.slug) : 0;
    const price = await resolveCoursePrice(meta.slug);
    return { meta, owns, passed, price };
  }));

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <div className="hero">
          <div className="badge">INTERACTIVE LANGUAGE COURSES</div>
          <h1>Learn languages, properly</h1>
          <p className="hero-sub">
            Exam-focused Catalan courses with full IPA pronunciation, native-speaker
            audio, auto-marked exercises and real mock exams.
          </p>
        </div>
        <div className="catalog-grid" data-test="catalog">
          {cards.map(({ meta, owns, passed, price }) => {
            const base = `/courses/${meta.slug}`;
            const pct = Math.round(passed / meta.stats.exercises * 100);
            return (
              <div className="card course-card" key={meta.slug} data-test={`course-${meta.slug}`}>
                <div className="course-card-head">
                  <span className="badge">{meta.language} · {meta.level}</span>
                  {owns && <span className="owned-tag" data-test="owned-tag">Purchased ✓</span>}
                </div>
                <h2>{meta.title}</h2>
                <p>{meta.tagline}</p>
                <p className="course-card-meta">{meta.description}</p>
                {owns ? (
                  <>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="course-card-stats">{passed} of {meta.stats.exercises} exercises passed</div>
                    <div className="course-card-actions">
                      <Link className="btn btn-primary" href={base} data-test="continue-course">
                        {passed > 0 ? 'Continue learning' : 'Start the course'}
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="course-card-actions">
                    <BuyButton courseSlug={meta.slug} priceLabel={price.label} returnTo={base} />
                    <Link className="btn" href={`${base}/unit/${meta.freeUnits[0]}`} data-test="free-preview">
                      Free preview · Unit {meta.freeUnits[0]}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
          <div className="card course-card coming-soon">
            <div className="course-card-head"><span className="badge">COMING NEXT</span></div>
            <h2>Catalan A2</h2>
            <p>The next level is in the works. Finish A1 first — it’s the foundation for everything that follows.</p>
          </div>
        </div>
        <p className="catalog-pricing-link">
          See <Link href="/pricing">full pricing &amp; what’s included →</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
