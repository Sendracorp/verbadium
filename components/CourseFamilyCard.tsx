'use client';
import { useState } from 'react';
import Link from 'next/link';
import { getDict, LOCALE_LABEL, t, type Locale } from '@/lib/i18n';
import type { BuyLabels } from '@/lib/ui-runtime';
import BuyButton from './BuyButton';

/* One catalog card per course FAMILY. The learner picks the language it's
   taught in; the selection drives the localized copy, price, buy target,
   preview link and (if owned) progress — each language being its own course. */
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

export default function CourseFamilyCard({ card, preferredMedium }:
  { card: FamilyCardData; preferredMedium?: Locale | null }) {
  // Default to a language the learner owns, else their remembered preference (if
  // this course offers it), else the first variant.
  const owned = card.variants.find(v => v.owns);
  const preferred = card.variants.find(v => v.medium === preferredMedium);
  const [sel, setSel] = useState<Locale>((owned ?? preferred ?? card.variants[0]).medium);
  const v = card.variants.find(x => x.medium === sel) ?? card.variants[0];
  const d = getDict(sel);
  const base = `/courses/${v.slug}`;
  const pct = Math.round((v.passed / card.totalExercises) * 100);

  return (
    <div className="card course-card" data-test={`course-${card.family}`}>
      <div className="course-card-head">
        <span className="badge">{card.language} · {card.level}</span>
        {v.owns && <span className="owned-tag" data-test="owned-tag">{d.card.purchased}</span>}
      </div>
      <h2>{d.course.name}</h2>
      <p>{d.course.tagline}</p>
      <p className="course-card-meta">{d.course.taughtInEnglish}</p>

      {card.variants.length > 1 && (
        <label className="medium-switcher course-card-lang">
          <span>{d.langLabel}</span>
          <select value={sel} onChange={e => setSel(e.target.value as Locale)} aria-label={d.langLabel}>
            {card.variants.map(o => <option key={o.medium} value={o.medium}>{LOCALE_LABEL[o.medium]}</option>)}
          </select>
        </label>
      )}

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
        <div className="course-card-actions">
          <BuyButton courseSlug={v.slug} priceLabel={v.priceLabel} returnTo={base} labels={v.buyLabels} />
          <Link className="btn" href={`${base}/unit/${card.freeUnit}`} data-test="free-preview">
            {d.card.preview}
          </Link>
        </div>
      )}
    </div>
  );
}
