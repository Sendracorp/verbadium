import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import BuyButton from '@/components/BuyButton';
import JsonLd from '@/components/JsonLd';
import { buyLabels } from '@/lib/ui';
import { courseFamilies } from '@/lib/courses';
import { resolveAllPrices } from '@/lib/pricing';
import { getSessionUser, userOwnsCourse, paywallBypassed } from '@/lib/access';

export const metadata: Metadata = {
  title: 'Pricing — one-time €70, lifetime access',
  description:
    'Verbadium pricing: buy the Catalan A1 course once for €70 and keep it forever — no subscription. Includes every unit, 100+ exercises, the mock exam, audio glossary and progress tracking. Free preview, no account needed.',
  alternates: { canonical: '/pricing' },
};
export const dynamic = 'force-dynamic';

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
  // One row per course family (its primary/English variant). Other languages
  // are reachable from the catalog's language chooser.
  const priced = await resolveAllPrices(courseFamilies().map(f => f.variants[0]));

  // which of these courses the current user already owns (don't show "buy")
  const user = await getSessionUser();
  const owned = new Set<string>();
  if (paywallBypassed()) priced.forEach(({ meta }) => owned.add(meta.slug));
  else if (user) {
    await Promise.all(priced.map(async ({ meta }) => {
      if (await userOwnsCourse(user.id, meta.slug)) owned.add(meta.slug);
    }));
  }

  return (
    <>
      <SiteHeader />
      <JsonLd data={FAQ_JSONLD} />
      <main className="site-main">
        <div className="hero">
          <div className="badge">PRICING</div>
          <h1>Simple, one-time pricing</h1>
          <p className="hero-sub">Buy a course once, keep it forever. No subscription.</p>
        </div>

        <div className="pricing-grid" data-test="pricing">
          {priced.map(({ meta, price }) => {
            const base = `/courses/${meta.slug}`;
            const isOwned = owned.has(meta.slug);
            return (
              <div className="card pricing-card" key={meta.slug} data-test={`pricing-${meta.slug}`} data-owned={isOwned || undefined}>
                <div className="badge">{meta.language} · {meta.level}</div>
                <h2>{meta.title}</h2>
                {isOwned ? (
                  <p className="pricing-amount pricing-owned" data-test="pricing-owned">✓ You own this course</p>
                ) : (
                  <>
                    <p className="pricing-amount" data-test="pricing-amount">{price.label}</p>
                    <p className="pricing-amount-note">one-time · tax added at checkout</p>
                  </>
                )}
                <ul className="sales-list">
                  <li>{meta.stats.units} units · {meta.stats.exercises} interactive exercises</li>
                  <li>Full mock {meta.level} exam with timers and attempt history</li>
                  <li>Glossary ({meta.stats.glossary} entries) with native-speaker audio</li>
                  <li>Progress synced across your devices</li>
                  <li>Lifetime access, including updates</li>
                </ul>
                <div className="paywall-actions">
                  {isOwned ? (
                    <Link className="btn btn-primary" href={base} data-test="pricing-go">Go to your course →</Link>
                  ) : (
                    <>
                      <BuyButton courseSlug={meta.slug} priceLabel={price.label} returnTo={base} labels={buyLabels('en')} />
                      <Link className="btn" href={`${base}/unit/${meta.freeUnits[0]}`}>
                        Free preview · Unit {meta.freeUnits[0]}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
      <SiteFooter />
    </>
  );
}
