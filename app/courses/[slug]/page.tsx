import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { getCourseMeta, mediumForSlug } from '@/lib/courses';
import { getCourseAccess } from '@/lib/access';
import Dashboard from '@/components/Dashboard';
import Checklist from '@/components/Checklist';
import SpeechScope from '@/components/SpeechScope';
import BuyButton from '@/components/BuyButton';
import PurchaseFinalizing from '@/components/PurchaseFinalizing';
import JsonLd from '@/components/JsonLd';
import { buyLabels } from '@/lib/ui';
import { resolveCoursePrice } from '@/lib/pricing';
import { SITE } from '@/lib/site';
import { hreflang, getDict, t, PATHS } from '@/lib/i18n';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = getCourseMeta(slug);
  if (!meta) return {};
  const d = getDict(mediumForSlug(slug));        // localized SEO copy for the variant
  const title = d.course.metaTitle;
  const description = d.course.metaDesc;
  const url = `/courses/${slug}`;
  return {
    title, description,
    // hreflang links the localized landing pages (only the Catalan A1 course has them)
    alternates: { canonical: url, ...(slug === 'catalan-a1' ? { languages: hreflang('course') } : {}) },
    openGraph: { title, description, url, type: 'website', siteName: SITE.brand },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CourseHomePage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { slug } = await params;
  const { purchased } = await searchParams;
  const meta = getCourseMeta(slug);
  const medium = mediumForSlug(slug);            // the variant's teaching language
  // access and price are independent — resolve in parallel.
  const [access, { label: price }] = await Promise.all([
    getCourseAccess(slug), resolveCoursePrice(slug),
  ]);
  const course = getCourseContent(slug);
  if (!meta || !course) notFound();
  const units = course.units.map(u => ({ num: u.num, title: u.title, exerciseIds: u.exerciseIds }));
  const base = `/courses/${slug}`;
  const d = getDict(medium);            // localized copy for this variant's language
  const vars = { units: meta.stats.units, exercises: meta.stats.exercises, glossary: meta.stats.glossary, price };

  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: d.course.name,
    description: d.course.tagline,
    url: `${SITE_URL}${base}`,
    inLanguage: 'ca',
    educationalLevel: `${meta.level} (CEFR)`,
    teaches: `${meta.language} ${meta.level}`,
    about: [`${meta.language} language`, 'Central Catalan', 'Catalan A1 exam'],
    coursePrerequisites: 'None — complete beginner',
    isAccessibleForFree: true,                                   // Unit 1 is a free preview
    provider: { '@type': 'EducationalOrganization', name: SITE.brand, url: SITE_URL },
    offers: {
      '@type': 'Offer', price: '25', priceCurrency: 'EUR',
      category: 'Paid', availability: 'https://schema.org/InStock', url: `${SITE_URL}/pricing`,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'PT20H',
      instructor: { '@type': 'Organization', name: SITE.brand },
    },
  };

  const hero = (
    <div className="hero">
      <div className="badge">CEFR · {meta.level} · {d.nav.course}</div>
      <h1>{d.course.name.replace(` (${meta.level})`, '')}</h1>
      <p className="hero-sub">{d.course.tagline}</p>
      <p className="hero-meta">{d.course.taughtInEnglish}</p>
    </div>
  );

  if (!access.owns) {
    // Just back from Paddle but the webhook hasn't granted access yet — show an
    // "unlocking…" state that refreshes until ownership lands, never the sales page.
    if (purchased === '1') {
      return (
        <>
          {hero}
          <PurchaseFinalizing
            received={d.purchase.received} unlocking={d.purchase.unlocking}
            slow={d.purchase.slow} refresh={d.purchase.refresh}
          />
        </>
      );
    }
    const previewUnit = meta.freeUnits[0];
    return (
      <>
        <JsonLd data={courseLd} />
        {hero}
        {/* Concise paywall — the full pitch + FAQ live on the pricing page. */}
        <div className="card paywall" data-test="sales-page">
          <h2>{t(d.course.salesHeading, vars)}</h2>
          <p className="paywall-preview">
            {d.course.previewLead}{' '}
            <Link href={`${base}/unit/${previewUnit}`} data-test="preview-link">{t(d.course.previewLink, { n: previewUnit })}</Link>
          </p>
          <div className="paywall-actions">
            <BuyButton courseSlug={slug} priceLabel={price} returnTo={base} labels={buyLabels(medium)} />
            <Link className="btn" href={(PATHS.pricing as Record<string, string>)[medium]}>{d.nav.pricing}</Link>
            {!access.user && (
              <Link className="btn" href={`/login?next=${encodeURIComponent(base)}`}>
                {d.course.alreadyBought}
              </Link>
            )}
          </div>
        </div>
        <div className="card">
          <SpeechScope html={course.introHtml} />
        </div>
      </>
    );
  }

  return (
    <>
      <JsonLd data={courseLd} />
      {hero}
      <Dashboard units={units} base={base} />
      <div className="card">
        <SpeechScope html={course.introHtml} />
      </div>
      <Checklist items={course.checklist} footHtml={course.checklistFootHtml} citeHtml={course.citeHtml} />
    </>
  );
}
