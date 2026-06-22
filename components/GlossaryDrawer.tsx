'use client';
/* Always-available glossary: a tab on the right edge (under the IPA one)
   toggles a slide-out drawer with the full searchable word list, so an owner
   can look anything up without leaving the page they're on. */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Glossary from './Glossary';
import type { GlossaryRow } from '@/lib/types';
import { useUI } from './CourseLocale';

export default function GlossaryDrawer({ rows, base }: { rows: GlossaryRow[]; base: string }) {
  const t = useUI();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // build the 275-row list only once opened

  useEffect(() => {
    if (!open) return;
    setMounted(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button" id="glosTab" className={`glos-tab${open ? ' open' : ''}`}
        aria-expanded={open} aria-controls="glosDrawer" title={t('nav.glossary')}
        onClick={() => setOpen(o => !o)}
      >
        <span>{t('nav.glossary')}</span>
      </button>
      <div className={`ipa-backdrop${open ? ' show' : ''}`} onClick={() => setOpen(false)} />
      <aside id="glosDrawer" className={`glos-drawer${open ? ' open' : ''}`} aria-label={t('nav.glossary')} aria-hidden={!open}>
        <div className="ipa-drawer-head">
          <b>{t('nav.glossary')}</b>
          <span>
            <Link href={`${base}/glossary`} onClick={() => setOpen(false)}>{t('glos.full')}</Link>
            <button type="button" className="ipa-close" aria-label={t('a11y.close')} onClick={() => setOpen(false)}>×</button>
          </span>
        </div>
        <div className="ipa-drawer-body glos-drawer-body">
          {mounted && <Glossary rows={rows} compact />}
        </div>
      </aside>
    </>
  );
}
