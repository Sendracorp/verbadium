'use client';
import { useMemo, useState } from 'react';
import type { GlossaryRow } from '@/lib/types';
import { deaccent } from '@/lib/check';
import { speak, stopSpeak } from '@/lib/speech';
import AudioCredits from './AudioCredits';

type SortCol = 0 | 1 | 2 | 3;

const ARTICLES = /^(el |la |els |les |l'|un |una )/;

export default function Glossary({ rows }: { rows: GlossaryRow[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ col: SortCol; dir: 1 | -1 } | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const val = (r: GlossaryRow, col: SortCol) =>
      col === 0 ? deaccent(r.ca).replace(ARTICLES, '') :
      col === 1 ? r.ipa : col === 2 ? r.en.toLowerCase() : r.unit;
    return [...rows].sort((a, b) => {
      const av = val(a, sort.col), bv = val(b, sort.col);
      if (sort.col === 3) return ((av as number) - (bv as number)) * sort.dir;
      return String(av).localeCompare(String(bv), 'ca') * sort.dir;
    });
  }, [rows, sort]);

  const q = deaccent(query);
  const visible = sorted.filter(r => !q || deaccent(`${r.ca} ${r.ipa} ${r.en} ${r.unit}`).includes(q));

  function clickSort(col: SortCol) {
    setSort(s => (s && s.col === col ? { col, dir: s.dir === 1 ? -1 : 1 } : { col, dir: 1 }));
  }
  const sortCls = (col: SortCol) =>
    `sortable${sort?.col === col ? (sort.dir === 1 ? ' asc' : ' desc') : ''}`;

  return (
    <div className="card">
      <h2>Glossary — every word in this course</h2>
      <p className="note">
        Alphabetical (articles ignored). U = the unit where the word is first taught.
        Pronunciations are Central Catalan, IPA. Click a column header to sort; click 🔊 to hear the word.
      </p>
      <div className="glos-tools">
        <input
          type="search" id="glosSearch"
          placeholder={`Search Catalan, IPA or English… (${rows.length} entries)`}
          value={query} onChange={e => setQuery(e.target.value)}
        />
        <span id="glosCount">
          {visible.length === rows.length ? `${rows.length} entries` : `${visible.length} of ${rows.length} entries`}
        </span>
      </div>
      <table className="glos" id="glosTable">
        <thead>
          <tr>
            <th className={sortCls(0)} data-sort={0} onClick={() => clickSort(0)}>Catalan</th>
            <th className={sortCls(1)} data-sort={1} onClick={() => clickSort(1)}>IPA</th>
            <th className={sortCls(2)} data-sort={2} onClick={() => clickSort(2)}>English</th>
            <th className={sortCls(3)} data-sort={3} onClick={() => clickSort(3)}>U.</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r, i) => (
            <tr key={`${r.ca}-${r.unit}`}>
              <td className="ca">
                {r.ca}{' '}
                <button
                  type="button" className={`say${speaking === i ? ' speaking' : ''}`}
                  title="Listen" aria-label={`Listen: ${r.ca}`}
                  onClick={() => { stopSpeak(); setSpeaking(i); speak(r.ca, () => setSpeaking(null)); }}
                >🔊</button>
              </td>
              <td className="pron">{r.ipa}</td>
              <td className="en">{r.en}</td>
              <td className="g-unit">{r.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <AudioCredits />
    </div>
  );
}
