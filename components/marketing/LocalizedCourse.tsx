import Link from 'next/link';
import SiteHeader from '../SiteHeader';
import SiteFooter from '../SiteFooter';
import JsonLd from '../JsonLd';
import { getDict, t, PATHS, type Locale } from '@/lib/i18n';
import { getCourseMeta } from '@/lib/courses';
import { resolveCoursePrice } from '@/lib/pricing';
import { SITE } from '@/lib/site';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';

/* Localized course landing (sales page) for ca/es/fr. Funnels to the English
   free preview + checkout; clearly states the course is taught in English. */
export default async function LocalizedCourse({ lang }: { lang: Locale }) {
  const d = getDict(lang);
  const meta = getCourseMeta('catalan-a1')!;
  const { label: price } = await resolveCoursePrice('catalan-a1');
  const preview = `/courses/catalan-a1/unit/${meta.freeUnits[0]}`;
  const vars = { units: meta.stats.units, exercises: meta.stats.exercises, glossary: meta.stats.glossary, price };

  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: d.course.name,
    description: d.course.tagline,
    url: `${SITE_URL}${PATHS.course[lang]}`,
    inLanguage: 'ca',
    educationalLevel: `${meta.level} (CEFR)`,
    teaches: `${meta.language} ${meta.level}`,
    coursePrerequisites: 'None — complete beginner',
    isAccessibleForFree: true,
    provider: { '@type': 'EducationalOrganization', name: SITE.brand, url: SITE_URL },
    offers: { '@type': 'Offer', price: '70', priceCurrency: 'EUR', category: 'Paid', availability: 'https://schema.org/InStock', url: `${SITE_URL}/pricing` },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', instructor: { '@type': 'Organization', name: SITE.brand } },
  };

  return (
    <div lang={lang}>
      <JsonLd data={courseLd} />
      <SiteHeader lang={lang} page="course" />
      <main className="site-main">
        <div className="hero">
          <div className="badge">CEFR · {meta.level} · {d.nav.course}</div>
          <h1>{d.course.name}</h1>
          <p className="hero-sub">{d.course.tagline}</p>
          <p className="hero-meta">{d.course.taughtInEnglish}</p>
        </div>
        <div className="card sales">
          <h2>{t(d.course.salesHeading, vars)}</h2>
          <ul className="sales-list">
            {d.course.bullets.map((b, i) => <li key={i}>{t(b, vars)}</li>)}
          </ul>
          <div className="paywall-actions">
            <Link className="btn btn-primary" href="/pricing">{d.card.buy}</Link>
            <Link className="btn" href={preview}>{d.card.preview}</Link>
          </div>
          <p className="paywall-preview">
            {d.course.previewLead} <Link href={preview}>{t(d.course.previewLink, { n: meta.freeUnits[0] })}</Link>
          </p>
          <p className="note">{d.course.alreadyBought}: <Link href={`/login?next=${encodeURIComponent(preview)}`}>{d.nav.login}</Link></p>
        </div>
      </main>
      <SiteFooter lang={lang} page="course" />
    </div>
  );
}
