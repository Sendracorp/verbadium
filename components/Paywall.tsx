import Link from 'next/link';
import BuyButton from './BuyButton';
import type { CourseMeta } from '@/lib/courses';
import { resolveCoursePrice } from '@/lib/pricing';
import { tUI, buyLabels } from '@/lib/ui';
import { getDict, type Locale } from '@/lib/i18n';

/* Server lock screen shown in place of gated content. Resolves the live
   Paddle price itself, so every paywall shows the real, current amount. */
export default async function Paywall({ meta, what, loggedIn, returnTo, locale = 'en' }: {
  meta: CourseMeta;
  what: string;                 // already-localized, e.g. "Unit 4" / "The glossary"
  loggedIn: boolean;
  returnTo: string;
  locale?: Locale;
}) {
  const previewUnit = meta.freeUnits[0];
  const { label: price } = await resolveCoursePrice(meta.slug);
  return (
    <div className="card paywall" data-test="paywall">
      <div className="badge">{tUI(locale, 'pw.locked')}</div>
      <h2>{tUI(locale, 'pw.partOfFull', { what })}</h2>
      <p>
        <b>{getDict(locale).course.name}</b> — {getDict(locale).course.tagline}
      </p>
      <p dangerouslySetInnerHTML={{ __html: tUI(locale, 'pw.oneTime', { price: `<b>${price}</b>`, units: meta.stats.units }) }} />
      <div className="paywall-actions">
        <BuyButton courseSlug={meta.slug} priceLabel={price} returnTo={returnTo} labels={buyLabels(locale)} />
        {!loggedIn && (
          <Link className="btn" href={`/login?next=${encodeURIComponent(returnTo)}`}>
            {tUI(locale, 'pw.alreadyBought')}
          </Link>
        )}
      </div>
      <p className="paywall-preview">
        {tUI(locale, 'pw.notSure')}{' '}
        <Link href={`/courses/${meta.slug}/unit/${previewUnit}`}>{tUI(locale, 'pw.tryFree', { n: previewUnit })}</Link>
        {' '}{tUI(locale, 'pw.noAccount')}
      </p>
    </div>
  );
}
