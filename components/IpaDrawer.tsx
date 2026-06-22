'use client';
/* Always-available IPA pronunciation reference: a tab fixed to the right
   edge of every page toggles a slide-out drawer with the condensed sound
   tables, so the student can check a symbol at any moment. */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SpeechScope from './SpeechScope';
import { useUI } from './CourseLocale';

export default function IpaDrawer({ html }: { html: string }) {
  const t = useUI();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        id="ipaTab"
        className={`ipa-tab${open ? ' open' : ''}`}
        aria-expanded={open}
        aria-controls="ipaDrawer"
        title={t('ipa.tab')}
        onClick={() => setOpen(o => !o)}
      >
        <span>{t('ipa.tabShort')}</span>
      </button>
      {/* always rendered (class-toggled) so the sibling list keeps a stable shape */}
      <div className={`ipa-backdrop${open ? ' show' : ''}`} id="ipaBackdrop" onClick={() => setOpen(false)} />
      <aside
        id="ipaDrawer"
        className={`ipa-drawer${open ? ' open' : ''}`}
        aria-label={t('ipa.tab')}
        aria-hidden={!open}
      >
        <div className="ipa-drawer-head">
          <b>{t('ipa.quick')}</b>
          <span>
            <Link href="/ipa" onClick={() => setOpen(false)}>{t('ipa.full')}</Link>
            <button type="button" className="ipa-close" aria-label={t('a11y.close')} onClick={() => setOpen(false)}>×</button>
          </span>
        </div>
        <div className="ipa-drawer-body">
          {/* keyed remount keeps SpeechScope's one-shot enhancement valid */}
          <SpeechScope html={html} />
        </div>
      </aside>
    </>
  );
}
