import Link from 'next/link';
import SiteHeader from '../SiteHeader';
import SiteFooter from '../SiteFooter';
import JsonLd from '../JsonLd';
import SetMedium from '../SetMedium';
import BuyButton from '../BuyButton';
import { getDict, t, PATHS, type Locale } from '@/lib/i18n';
import { getCourseMeta, variantForMedium } from '@/lib/courses';
import { buyLabels } from '@/lib/ui';

/* Localized pricing page (price + what's included + FAQ), mirroring /pricing.
   Sells the course variant taught in this language; locales with no variant
   (ca) funnel to the English course. Static — the live price is charged at
   checkout; this shows the fixed label. */
export default function LocalizedPricing({ lang }: { lang: Locale }) {
  const d = getDict(lang);
  const meta = getCourseMeta('catalan-a1')!;
  const variant = variantForMedium('catalan-a1', lang) ?? meta;
  const base = `/courses/${variant.slug}`;
  const price = meta.priceLabel;
  const preview = `${base}/unit/${meta.freeUnits[0]}`;
  const vars = { units: meta.stats.units, exercises: meta.stats.exercises, glossary: meta.stats.glossary, price };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: d.pricing.faq.map(f => ({
      '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div lang={lang}>
      <SetMedium lang={lang} />
      <JsonLd data={faqLd} />
      <SiteHeader lang={lang} page="pricing" />
      <main className="site-main">
        <div className="hero">
          <div className="badge">{d.nav.pricing}</div>
          <h1>{d.pricing.title}</h1>
          <p className="hero-sub">{d.pricing.sub}</p>
        </div>

        <div className="pricing-grid" data-test="pricing">
          <div className="card pricing-card">
            <div className="badge">{d.course.subject} · {meta.level}</div>
            <h2>{d.course.name}</h2>
            <p className="pricing-amount" data-test="pricing-amount">{price}</p>
            <p className="pricing-amount-note">{d.card.lifetime}</p>
            <ul className="sales-list">
              {d.course.bullets.map((b, i) => <li key={i}>{t(b, vars)}</li>)}
            </ul>
            <div className="paywall-actions">
              <BuyButton courseSlug={variant.slug} priceLabel={price} returnTo={base} labels={buyLabels(lang)} />
              <Link className="btn" href={preview}>{d.card.preview}</Link>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>{d.pricing.faqHeading}</h2>
          <dl className="faq">
            {d.pricing.faq.map((f, i) => (
              <div key={i} className="faq-item">
                <dt>{f.q}</dt>
                <dd>{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
      <SiteFooter lang={lang} page="pricing" />
    </div>
  );
}
