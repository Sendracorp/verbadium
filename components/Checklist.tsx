'use client';
import { useEffect, useState } from 'react';
import { sget, sset, subscribe } from '@/lib/progress';
import { useUI } from './CourseLocale';

export interface NextCourseCta {
  label: string;        // localized "Next step:"
  courseName: string;   // localized short name, e.g. "Catalan A2"
  href?: string;        // link to the next course (its language variant) — absent until it's available
  cta: string;          // localized "See the course"
  soon: string;         // localized "coming soon"
}

export default function Checklist({ items, footHtml, citeHtml, next }:
  { items: string[]; footHtml: string; citeHtml: string; next?: NextCourseCta }) {
  const t = useUI();
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  useEffect(() => {
    const read = () => setChecked(prev => items.map((_, i) => !!sget<boolean[]>('checklist', [])[i] || false) ?? prev);
    read();
    return subscribe(read);
  }, [items]);

  function toggle(i: number, v: boolean) {
    const cur = sget<boolean[]>('checklist', []);
    cur[i] = v;
    sset('checklist', cur);
  }

  return (
    <div className="card" id="checklistCard">
      <h2>{t('chklist.title')}</h2>
      <p>{t('chklist.intro')}</p>
      <ul className="checklist interactive">
        {items.map((html, i) => (
          <li key={i} className={checked[i] ? 'done' : ''}>
            <label>
              <input
                type="checkbox" className="check-item" data-check={i}
                checked={checked[i] ?? false}
                onChange={e => toggle(i, e.target.checked)}
              />
              {' '}<span dangerouslySetInnerHTML={{ __html: html }} />
            </label>
          </li>
        ))}
      </ul>
      {footHtml && <div dangerouslySetInnerHTML={{ __html: footHtml }} />}
      {next && (
        <p className="note" style={{ marginTop: '6mm' }}>
          {next.label} <b>{next.courseName}</b>
          {' — '}
          {next.href
            ? <a href={next.href}>{next.cta} →</a>
            : <>({next.soon})</>}
        </p>
      )}
      {citeHtml && <div dangerouslySetInnerHTML={{ __html: citeHtml }} />}
    </div>
  );
}
