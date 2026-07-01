import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { hreflang } from '@/lib/i18n';

// Static/ISR: the catalog is impersonal (no per-user state), so it's served
// from the CDN for a fast LCP. The price comes from a cached fetch
// (revalidates hourly). Ownership/"continue" is intentionally not shown here —
// it's a marketing page; owners get it on /account and the course page (this
// matches the already-static localized homes /es, /fr, …).
export const metadata: Metadata = {
  alternates: { canonical: '/', languages: hreflang('home') },
};

import Catalog from '@/components/Catalog';
import { type FamilyCardData } from '@/components/CourseFamilyCard';
import JsonLd from '@/components/JsonLd';
import { buyLabels } from '@/lib/ui';
import { courseFamilies } from '@/lib/courses';
import { resolveCoursePrice } from '@/lib/pricing';
import { SITE } from '@/lib/site';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';

// Entity schema for AI/search — identifies Verbadium as the publisher and links
// the locale variants of the site (helps Google AI + entity recognition).
const siteLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization', '@id': `${SITE_URL}/#org`,
      name: SITE.brand, url: SITE_URL,
      description: 'Interactive, exam-focused online language courses — starting with Catalan A1.',
    },
    {
      '@type': 'WebSite', '@id': `${SITE_URL}/#website`,
      url: SITE_URL, name: SITE.brand, publisher: { '@id': `${SITE_URL}/#org` },
      inLanguage: ['en', 'ca', 'es', 'fr', 'ru', 'de'],
    },
  ],
};

export default async function CatalogPage() {
  // The root catalog is the English page; localized visitors use /es, /fr, … —
  // so this card renders in English and never mixes languages with the page.
  // One card per family; price is a cached lookup (keeps the page static/ISR).
  const cards: FamilyCardData[] = await Promise.all(courseFamilies().map(async ({ family, variants }) => {
    const views = await Promise.all(variants.map(async v => {
      const price = await resolveCoursePrice(v.slug);
      return {
        medium: v.medium, slug: v.slug, audienceLanguage: v.audienceLanguage,
        owns: false, passed: 0, priceLabel: price.label, buyLabels: buyLabels(v.medium),
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
      <JsonLd data={siteLd} />
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
          <Catalog cards={cards} />
          {/* Placeholder until A2 is live; once it's a real card, drop this. */}
          {!cards.some(c => c.family === 'catalan-a2') && (
            <div className="card course-card coming-soon">
              <div className="course-card-head"><span className="badge">COMING NEXT</span></div>
              <h2>Catalan A2</h2>
              <p>The next level is written and in final preparation. Finish A1 first — it’s the foundation for everything that follows.</p>
            </div>
          )}
        </div>
        <p className="catalog-pricing-link">
          See <Link href="/pricing">full pricing &amp; what’s included →</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
