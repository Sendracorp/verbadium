import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { getMedium } from '@/lib/medium';
import { getCourseMeta } from '@/lib/courses';
import { getCourseAccess } from '@/lib/access';
import Dashboard from '@/components/Dashboard';
import Checklist from '@/components/Checklist';
import SpeechScope from '@/components/SpeechScope';
import BuyButton from '@/components/BuyButton';
import JsonLd from '@/components/JsonLd';
import { resolveCoursePrice } from '@/lib/pricing';
import { SITE } from '@/lib/site';
import { hreflang } from '@/lib/i18n';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = getCourseMeta(slug);
  if (!meta) return {};
  const title = `${meta.language} Course Online (${meta.level}) — exam prep with audio & exercises`;
  const description =
    `Learn ${meta.language} online. ${meta.tagline} ${meta.stats.exercises} interactive exercises, ` +
    `native-speaker audio, full IPA, listening drills and a mock exam. Prepares for the official ` +
    `Catalan A1 exam (Certificat de nivell inicial de català), the official language of Andorra. ` +
    `Free preview of Unit 1 — no account needed.`;
  const url = `/courses/${slug}`;
  return {
    title, description,
    // hreflang links the localized landing pages (only the Catalan A1 course has them)
    alternates: { canonical: url, ...(slug === 'catalan-a1' ? { languages: hreflang('course') } : {}) },
    openGraph: { title, description, url, type: 'website', siteName: SITE.brand },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CourseHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getCourseMeta(slug);
  const medium = await getMedium(slug);
  const course = getCourseContent(slug, medium);
  if (!meta || !course) notFound();

  const access = await getCourseAccess(slug);
  const { label: price } = await resolveCoursePrice(slug);
  const units = course.units.map(u => ({ num: u.num, title: u.title, exerciseIds: u.exerciseIds }));
  const base = `/courses/${slug}`;

  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: meta.title,
    description: meta.tagline,
    url: `${SITE_URL}${base}`,
    inLanguage: 'ca',
    educationalLevel: `${meta.level} (CEFR)`,
    teaches: `${meta.language} ${meta.level}`,
    about: [`${meta.language} language`, 'Central Catalan', 'Catalan A1 exam'],
    coursePrerequisites: 'None — complete beginner',
    isAccessibleForFree: true,                                   // Unit 1 is a free preview
    provider: { '@type': 'EducationalOrganization', name: SITE.brand, url: SITE_URL },
    offers: {
      '@type': 'Offer', price: '70', priceCurrency: 'EUR',
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
      <div className="badge">CEFR · LEVEL {meta.level} · EXAM PREPARATION</div>
      <h1>{meta.title.replace(` (${meta.level})`, '')}</h1>
      <p className="hero-sub">{meta.tagline}</p>
      <p className="hero-meta">{meta.description}</p>
    </div>
  );

  if (!access.owns) {
    const previewUnit = meta.freeUnits[0];
    return (
      <>
        <JsonLd data={courseLd} />
        {hero}
        <div className="card sales" data-test="sales-page">
          <h2>Get the full course — {price}, yours forever</h2>
          <ul className="sales-list">
            <li>All {meta.stats.units} units with {meta.stats.exercises} interactive, auto-marked exercises</li>
            <li>Full mock A1 exam with per-paper timers and attempt history</li>
            <li>Complete glossary ({meta.stats.glossary} entries) with audio and IPA</li>
            <li>Progress saved to your account — continue on any device</li>
            <li>One payment, no subscription</li>
          </ul>
          <div className="paywall-actions">
            <BuyButton courseSlug={slug} priceLabel={price} returnTo={base} locale={medium} />
            {!access.user && (
              <Link className="btn" href={`/login?next=${encodeURIComponent(base)}`}>
                Already bought it? Log in
              </Link>
            )}
          </div>
          <p className="paywall-preview">
            Try before you buy: <Link href={`${base}/unit/${previewUnit}`} data-test="preview-link">Unit {previewUnit} is free</Link>
            {' '}— along with the <Link href={`${base}/ipa`}>IPA guide</Link> and{' '}
            <Link href={`${base}/exam`}>exam information</Link>. No account needed.
          </p>
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
