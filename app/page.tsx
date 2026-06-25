import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { hreflang } from '@/lib/i18n';

// Auth/ownership state must be evaluated per request, even when the build
// runs with unconfigured placeholder credentials.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: '/', languages: hreflang('home') },
};

import CourseFamilyCard, { type FamilyCardData } from '@/components/CourseFamilyCard';
import { buyLabels } from '@/lib/ui';
import { courseFamilies } from '@/lib/courses';
import { getSessionUser, paywallBypassed, userOwnsCourse } from '@/lib/access';
import { countPassedExercises } from '@/lib/progress-server';
import { resolveCoursePrice } from '@/lib/pricing';

export default async function CatalogPage() {
  // The root catalog is the English page; localized visitors use /es, /fr, … —
  // so this card renders in English and never mixes languages with the page.
  const user = await getSessionUser();
  const bypass = paywallBypassed();

  // One card per family; each language variant carries its own ownership,
  // progress, price and (localized) buy labels.
  const cards: FamilyCardData[] = await Promise.all(courseFamilies().map(async ({ family, variants }) => {
    const views = await Promise.all(variants.map(async v => {
      const owns = bypass || (user ? await userOwnsCourse(user.id, v.slug) : false);
      const [passed, price] = await Promise.all([
        owns && user ? countPassedExercises(user.id, v.slug) : Promise.resolve(0),
        resolveCoursePrice(v.slug),
      ]);
      return {
        medium: v.medium, slug: v.slug, audienceLanguage: v.audienceLanguage,
        owns, passed, priceLabel: price.label, buyLabels: buyLabels(v.medium),
      };
    }));
    const primary = variants[0];
    return {
      family, language: primary.language, level: primary.level,
      freeUnit: primary.freeUnits[0], totalExercises: primary.stats.exercises,
      variants: views,
    };
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
          {cards.map(card => <CourseFamilyCard key={card.family} card={card} />)}
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
