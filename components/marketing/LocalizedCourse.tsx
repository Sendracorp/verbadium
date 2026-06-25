import Link from 'next/link';
import SiteHeader from '../SiteHeader';
import SiteFooter from '../SiteFooter';
import JsonLd from '../JsonLd';
import SetMedium from '../SetMedium';
import BuyButton from '../BuyButton';
import { getDict, t, PATHS, type Locale } from '@/lib/i18n';
import { getCourseMeta, variantForMedium } from '@/lib/courses';
import { buyLabels } from '@/lib/ui';
import { SITE } from '@/lib/site';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';

/* Localized course landing (sales page). Sells the variant taught in this
   language (es/fr/ru/de); locales with no teaching variant (ca) funnel to the
   English course. Uses the fixed price label (not the live Paddle fetch) so the
   page stays static — the live price is charged at checkout. */
export default function LocalizedCourse({ lang }: { lang: Locale }) {
  const d = getDict(lang);
  const meta = getCourseMeta('catalan-a1')!;
  // The course variant this page sells (its own language, else English).
  const variant = variantForMedium('catalan-a1', lang) ?? meta;
  const base = `/courses/${variant.slug}`;
  const price = meta.priceLabel;
  const preview = `${base}/unit/${meta.freeUnits[0]}`;
  const vars = { units: meta.stats.units, exercises: meta.stats.exercises, glossary: meta.stats.glossary, price };

  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: d.course.name,
    description: d.course.tagline,
    url: `${SITE_URL}${(PATHS.course as Record<string, string>)[lang]}`,
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
      <SetMedium lang={lang} />
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
            <BuyButton courseSlug={variant.slug} priceLabel={price} returnTo={base} labels={buyLabels(lang)} />
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
