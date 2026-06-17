import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import BuyButton from '@/components/BuyButton';
import { COURSES } from '@/lib/courses';
import { resolveAllPrices } from '@/lib/pricing';

export const metadata: Metadata = { title: 'Pricing' };
export const dynamic = 'force-dynamic';

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Is this a subscription?',
    a: 'No. Each course is a single one-time payment and yours for life, including future updates to that course. There is no recurring charge.',
  },
  {
    q: 'What’s included in the price?',
    a: 'Everything in the course: all units, every interactive exercise, the full mock exam, the complete glossary with native-speaker audio, and progress tracking synced across your devices.',
  },
  {
    q: 'Can I try before I buy?',
    a: <>Yes — the first unit of every course, the IPA guide and the exam information are free, no account needed.</>,
  },
  {
    q: 'Which taxes apply?',
    a: 'Prices are shown excluding tax. Any VAT or sales tax required for your country is calculated and added at checkout by Paddle, our merchant of record.',
  },
  {
    q: 'Can I get a refund?',
    a: <>Courses are digital with immediate lifetime access, so all sales are final — please use the free preview before buying. If something’s broken or you’re charged twice, just contact us. See our <Link href="/refunds">refund policy</Link>.</>,
  },
];

export default async function PricingPage() {
  const priced = await resolveAllPrices(COURSES);

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <div className="hero">
          <div className="badge">PRICING</div>
          <h1>Simple, one-time pricing</h1>
          <p className="hero-sub">Buy a course once, keep it forever. No subscription.</p>
        </div>

        <div className="pricing-grid" data-test="pricing">
          {priced.map(({ meta, price }) => {
            const base = `/courses/${meta.slug}`;
            return (
              <div className="card pricing-card" key={meta.slug} data-test={`pricing-${meta.slug}`}>
                <div className="badge">{meta.language} · {meta.level}</div>
                <h2>{meta.title}</h2>
                <p className="pricing-amount" data-test="pricing-amount">{price.label}</p>
                <p className="pricing-amount-note">one-time · tax added at checkout</p>
                <ul className="sales-list">
                  <li>{meta.stats.units} units · {meta.stats.exercises} interactive exercises</li>
                  <li>Full mock {meta.level} exam with timers and attempt history</li>
                  <li>Glossary ({meta.stats.glossary} entries) with native-speaker audio</li>
                  <li>Progress synced across your devices</li>
                  <li>Lifetime access, including updates</li>
                </ul>
                <div className="paywall-actions">
                  <BuyButton courseSlug={meta.slug} priceLabel={price.label} returnTo={base} />
                  <Link className="btn" href={`${base}/unit/${meta.freeUnits[0]}`}>
                    Free preview · Unit {meta.freeUnits[0]}
                  </Link>
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
