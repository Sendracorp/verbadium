import Link from 'next/link';
import BuyButton from './BuyButton';
import type { CourseMeta } from '@/lib/courses';

/* Server-renderable lock screen shown in place of gated content. */
export default function Paywall({ meta, what, loggedIn, returnTo }: {
  meta: CourseMeta;
  what: string;                 // e.g. "Unit 4" / "the mock exam" / "the glossary"
  loggedIn: boolean;
  returnTo: string;
}) {
  const previewUnit = meta.freeUnits[0];
  return (
    <div className="card paywall" data-test="paywall">
      <div className="badge">LOCKED</div>
      <h2>{what} is part of the full course</h2>
      <p>
        <b>{meta.title}</b> — {meta.description}
      </p>
      <p>
        One payment of <b>{meta.priceLabel}</b> unlocks everything, forever: all {meta.stats.units} units,
        the mock exam with timers, the full glossary and progress tracking across your devices.
      </p>
      <div className="paywall-actions">
        <BuyButton courseSlug={meta.slug} priceLabel={meta.priceLabel} returnTo={returnTo} />
        {!loggedIn && (
          <Link className="btn" href={`/login?next=${encodeURIComponent(returnTo)}`}>
            Already bought it? Log in
          </Link>
        )}
      </div>
      <p className="paywall-preview">
        Not sure yet? <Link href={`/courses/${meta.slug}/unit/${previewUnit}`}>Try Unit {previewUnit} free</Link>
        {' '}— no account needed.
      </p>
    </div>
  );
}
