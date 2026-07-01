import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import JsonLd from '@/components/JsonLd';
import PricingCards, { type PricingCardData } from '@/components/PricingCards';
import { hreflang } from '@/lib/i18n';
import { courseFamilies } from '@/lib/courses';
import { resolveAllPrices } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Pricing — one-time €25, lifetime access',
  description:
    'Verbadium pricing: buy the Catalan A1 course once for €25 and keep it forever — no subscription. Includes every unit, 100+ exercises, the mock exam, audio glossary and progress tracking. Free preview, no account needed.',
  alternates: { canonical: '/pricing', languages: hreflang('pricing') },
};
// Static/ISR (prices are a cached lookup) so it's CDN-served for a fast LCP.
// Impersonal, like the already-static localized pricing pages (/es/precios …).

const FAQ: { q: string; a: React.ReactNode; text: string }[] = [
  {
    q: 'Is this a subscription?',
    a: 'No. Each course is a single one-time payment and yours for life, including future updates to that course. There is no recurring charge.',
    text: 'No. Each course is a single one-time payment and yours for life, including future updates to that course. There is no recurring charge.',
  },
  {
    q: 'What’s included in the price?',
    a: 'Everything in the course: all units, every interactive exercise, the full mock exam, the complete glossary with native-speaker audio, and progress tracking synced across your devices.',
    text: 'Everything in the course: all units, every interactive exercise, the full mock exam, the complete glossary with native-speaker audio, and progress tracking synced across your devices.',
  },
  {
    q: 'Can I try before I buy?',
    a: <>Yes — the first unit of every course, the IPA guide and the exam information are free, no account needed.</>,
    text: 'Yes — the first unit of every course, the IPA guide and the exam information are free, no account needed.',
  },
  {
    q: 'Which taxes apply?',
    a: 'Prices are shown excluding tax. Any VAT or sales tax required for your country is calculated and added at checkout by Paddle, our merchant of record.',
    text: 'Prices are shown excluding tax. Any VAT or sales tax required for your country is calculated and added at checkout by Paddle, our merchant of record.',
  },
  {
    q: 'Can I get a refund?',
    a: <>Courses are digital with immediate lifetime access, so all sales are final — please use the free preview before buying. If something’s broken or you’re charged twice, just contact us. See our <Link href="/refunds">refund policy</Link>.</>,
    text: 'Courses are digital with immediate lifetime access, so all sales are final — please use the free preview before buying. If something is broken or you are charged twice, just contact us. See our refund policy.',
  },
];

const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.text },
  })),
};

export default async function PricingPage() {
  // One row per course family (its primary/English variant). Each card lists the
  // languages the course can be bought in (AvailableLanguages).
  const families = courseFamilies();
  const priced = await resolveAllPrices(families.map(f => f.variants[0]));
  const cards: PricingCardData[] = priced.map(({ meta, price }) => ({
    slug: meta.slug, family: meta.family, title: meta.title,
    language: meta.language, level: meta.level, priceLabel: price.label,
    freeUnit: meta.freeUnits[0], units: meta.stats.units,
    exercises: meta.stats.exercises, glossary: meta.stats.glossary,
    mediums: families.find(f => f.family === meta.family)?.variants.map(v => v.medium) ?? [],
  }));

  return (
    <>
      <SiteHeader page="pricing" />
      <JsonLd data={FAQ_JSONLD} />
      <main className="site-main">
        <div className="hero">
          <div className="badge">PRICING</div>
          <h1>Simple, one-time pricing</h1>
          <p className="hero-sub">Buy a course once, keep it forever. No subscription.</p>
        </div>

        <div className="pricing-grid" data-test="pricing">
          <PricingCards cards={cards} />
        </div>

        <div className="card">
          <h2>Frequently asked questions</h2>
          <dl className="faq">
            {FAQ.map(({ q, a }, i) => (
              <div key={i} className="faq-item">
                <dt>{q}</dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
      <SiteFooter page="pricing" />
    </>
  );
}
