import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { getCourseMeta, mediumForSlug, nextCourse, variantForMedium } from '@/lib/courses';
import { getCourseAccess, getViewableCourse } from '@/lib/access';
import Dashboard from '@/components/Dashboard';
import Checklist from '@/components/Checklist';
import SpeechScope from '@/components/SpeechScope';
import BuyButton from '@/components/BuyButton';
import PurchaseFinalizing from '@/components/PurchaseFinalizing';
import JsonLd from '@/components/JsonLd';
import { buyLabels } from '@/lib/ui';
import { resolveCoursePrice } from '@/lib/pricing';
import { SITE } from '@/lib/site';
import { hreflang, getDict, courseCopy, t, PATHS } from '@/lib/i18n';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = getCourseMeta(slug);
  if (!meta) return {};
  const d = getDict(mediumForSlug(slug));        // localized SEO copy for the variant
  const cc = courseCopy(d, meta.family);
  const title = cc.metaTitle;
  const description = cc.metaDesc;
  const url = `/courses/${slug}`;
  // hreflang links the localized landing pages — only the English member of a
  // family has them (other variants are noindex). Each family has its own cluster.
  const langs = meta.medium === 'en'
    ? hreflang(meta.family === 'catalan-a2' ? 'courseA2' : 'course')
    : null;
  return {
    title, description,
    alternates: { canonical: url, ...(langs ? { languages: langs } : {}) },
    openGraph: { title, description, url, type: 'website', siteName: SITE.brand, images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] },
  };
}

export default async function CourseHomePage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { slug } = await params;
  const { purchased } = await searchParams;
  const meta = await getViewableCourse(slug);    // pre-launch courses: owners/admins only
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
  const cc = courseCopy(d, meta.family);

  // "Next step" CTA under the checklist — links to the follow-up course in this
  // learner's language when it's available, else shows a coming-soon label. The
  // linked course page shows its free unit + buy button to non-owners.
  const nextMeta = nextCourse(meta.family);
  const nextVariant = nextMeta ? variantForMedium(nextMeta.family, medium) : undefined;
  const next = nextMeta ? {
    label: d.card.nextStep,
    courseName: `${courseCopy(d, nextMeta.family).subject} ${nextMeta.level}`,
    href: nextVariant ? `/courses/${nextVariant.slug}` : undefined,
    cta: d.home.seeCourse,
    soon: d.card.comingSoon,
  } : undefined;
  const vars = { units: meta.stats.units, exercises: meta.stats.exercises, glossary: meta.stats.glossary, price };

  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: cc.name,
    description: cc.tagline,
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
      <h1>{cc.name.replace(` (${meta.level})`, '')}</h1>
      <p className="hero-sub">{cc.tagline}</p>
      <p className="hero-meta">{cc.taughtInEnglish}</p>
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
          <h2>{t(cc.salesHeading, vars)}</h2>
          <p className="paywall-preview">
            {cc.previewLead}{' '}
            <Link href={`${base}/unit/${previewUnit}`} data-test="preview-link">{t(cc.previewLink, { n: previewUnit })}</Link>
          </p>
          <div className="paywall-actions">
            <BuyButton courseSlug={slug} priceLabel={price} returnTo={base} labels={buyLabels(medium)} />
            <Link className="btn" href={(PATHS.pricing as Record<string, string>)[medium]}>{d.nav.pricing}</Link>
            {!access.user && (
              <Link className="btn" href={`/login?next=${encodeURIComponent(base)}`}>
                {cc.alreadyBought}
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
      <Checklist items={course.checklist} footHtml={course.checklistFootHtml} citeHtml={course.citeHtml} next={next} />
    </>
  );
}
