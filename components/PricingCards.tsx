'use client';
import Link from 'next/link';
import BuyButton from './BuyButton';
import AvailableLanguages from './AvailableLanguages';
import { buyLabels } from '@/lib/ui';
import type { Locale } from '@/lib/i18n';
import { useOwnedCourses } from '@/lib/use-owned-courses';

export interface PricingCardData {
  slug: string;
  family: string;
  title: string;
  language: string;
  level: string;
  priceLabel: string;
  freeUnit: number;
  units: number;
  exercises: number;
  glossary: number;
  mediums: Locale[];
}

/* Pricing cards on the static /pricing page. Renders the buy CTA server-side
   (correct for crawlers and logged-out visitors); for signed-in owners it
   swaps to "you own this / go to your course" after mount — so the page stays
   statically rendered but owners don't see a buy button for what they own. */
export default function PricingCards({ cards }: { cards: PricingCardData[] }) {
  const owned = useOwnedCourses();
  return (
    <>
      {cards.map(c => {
        const base = `/courses/${c.slug}`;
        const isOwned = !!owned[c.slug];
        return (
          <div className="card pricing-card" key={c.slug} data-test={`pricing-${c.slug}`} data-owned={isOwned || undefined}>
            <div className="badge">{c.language} · {c.level}</div>
            <h2>{c.title}</h2>
            {isOwned ? (
              <p className="pricing-amount pricing-owned" data-test="pricing-owned">✓ You own this course</p>
            ) : (
              <>
                <p className="pricing-amount" data-test="pricing-amount">{c.priceLabel}</p>
                <p className="pricing-amount-note">one-time · tax added at checkout</p>
              </>
            )}
            <ul className="sales-list">
              <li>{c.units} units · {c.exercises} interactive exercises</li>
              <li>Full mock {c.level} exam with timers and attempt history</li>
              <li>Glossary ({c.glossary} entries) with native-speaker audio</li>
              <li>Progress synced across your devices</li>
              <li>Lifetime access, including updates</li>
            </ul>
            <div className="paywall-actions">
              {isOwned ? (
                <Link className="btn btn-primary" href={base} data-test="pricing-go">Go to your course →</Link>
              ) : (
                <>
                  <BuyButton courseSlug={c.slug} priceLabel={c.priceLabel} returnTo={base} labels={buyLabels('en')} />
                  <Link className="btn" href={`${base}/unit/${c.freeUnit}`}>
                    Free preview · Unit {c.freeUnit}
                  </Link>
                </>
              )}
            </div>
            <AvailableLanguages mediums={c.mediums} label="Available in" />
          </div>
        );
      })}
    </>
  );
}
