import Link from 'next/link';
import { getDict, courseCopy, t, type Locale } from '@/lib/i18n';
import type { BuyLabels } from '@/lib/ui-runtime';
import BuyButton from './BuyButton';
import AvailableLanguages from './AvailableLanguages';

/* One catalog card per course family, rendered entirely in the PAGE's language
   (so a page never mixes languages). Each language is its own course; to view
   the course in another language, switch the whole page via the language
   switcher — which lands on that language's home. */
export interface VariantView {
  medium: Locale;
  slug: string;
  audienceLanguage: string;
  owns: boolean;
  passed: number;
  priceLabel: string;
  buyLabels: BuyLabels;
}
export interface FamilyCardData {
  family: string;
  language: string;
  level: string;
  freeUnit: number;
  totalExercises: number;
  variants: VariantView[];
}

export default function CourseFamilyCard({ card, locale = 'en' }: { card: FamilyCardData; locale?: Locale }) {
  const v = card.variants.find(x => x.medium === locale) ?? card.variants[0];
  const d = getDict(locale);
  const cc = courseCopy(d, card.family);
  const base = `/courses/${v.slug}`;
  const pct = Math.round((v.passed / card.totalExercises) * 100);

  return (
    <div className="card course-card" data-test={`course-${card.family}`}>
      <div className="course-card-head">
        <span className="badge">{cc.subject} · {card.level}</span>
        {v.owns && <span className="owned-tag" data-test="owned-tag">{d.card.purchased}</span>}
      </div>
      <h2>{cc.name}</h2>
      <p>{cc.tagline}</p>
      <p className="course-card-meta">{cc.taughtInEnglish}</p>
      <AvailableLanguages mediums={card.variants.map(v => v.medium)} label={d.card.availableIn} />

      {v.owns ? (
        <>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="course-card-stats">{t(d.card.progress, { passed: v.passed, total: card.totalExercises })}</div>
          <div className="course-card-actions">
            <Link className="btn btn-primary" href={base} data-test="continue-course">
              {v.passed > 0 ? d.card.cont : d.card.start}
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="course-card-price" data-test="course-price">
            {v.priceLabel} <span className="course-card-price-note">· {d.card.lifetime}</span>
          </p>
          <div className="course-card-actions">
            <BuyButton courseSlug={v.slug} priceLabel={v.priceLabel} returnTo={base} labels={v.buyLabels} />
            <Link className="btn" href={`${base}/unit/${card.freeUnit}`} data-test="free-preview">
              {d.card.preview}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
