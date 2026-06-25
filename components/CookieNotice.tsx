'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/* Informational cookie notice (NOT a consent gate): we only use essential +
   functional cookies and cookieless analytics, so no opt-in is required. The
   "dismissed" flag lives in localStorage — it is not a tracking cookie.
   Localized from the URL prefix, since the root layout has no locale. */
const KEY = 'vb-cookie-notice';

type Strings = { body: string; learn: string; ok: string };
const NOTICE: Record<string, Strings> = {
  en: {
    body: 'We use only essential cookies to run the site and keep you signed in, plus privacy-friendly, cookieless analytics. No ads, no third-party tracking.',
    learn: 'Learn more', ok: 'Got it',
  },
  ca: {
    body: 'Només fem servir galetes essencials per fer funcionar el lloc i mantenir-te amb la sessió iniciada, més analítiques respectuoses amb la privadesa i sense galetes. Sense anuncis ni seguiment de tercers.',
    learn: 'Més informació', ok: 'Entesos',
  },
  es: {
    body: 'Solo usamos cookies esenciales para que el sitio funcione y mantener tu sesión iniciada, además de analíticas respetuosas con la privacidad y sin cookies. Sin anuncios ni seguimiento de terceros.',
    learn: 'Más información', ok: 'Entendido',
  },
  fr: {
    body: 'Nous n’utilisons que des cookies essentiels pour faire fonctionner le site et vous garder connecté, ainsi que des statistiques respectueuses de la vie privée et sans cookies. Pas de publicité ni de suivi tiers.',
    learn: 'En savoir plus', ok: 'J’ai compris',
  },
  ru: {
    body: 'Мы используем только необходимые файлы cookie для работы сайта и сохранения входа, а также аналитику без файлов cookie, уважающую конфиденциальность. Без рекламы и стороннего отслеживания.',
    learn: 'Подробнее', ok: 'Понятно',
  },
  de: {
    body: 'Wir verwenden nur essenzielle Cookies, damit die Website funktioniert und du angemeldet bleibst, sowie datenschutzfreundliche, cookielose Analysen. Keine Werbung, kein Tracking durch Dritte.',
    learn: 'Mehr erfahren', ok: 'Verstanden',
  },
};

export default function CookieNotice() {
  const [show, setShow] = useState(false);
  const path = usePathname() ?? '/';
  const seg = path.split('/')[1];
  const t = NOTICE[seg] ?? NOTICE.en;

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch { /* storage blocked */ }
  }, []);
  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* storage blocked */ }
    setShow(false);
  };

  return (
    <div className="cookie-notice" role="region" aria-label="Cookie notice">
      <p className="cookie-notice-text">
        {t.body} <Link href="/cookies">{t.learn}</Link>.
      </p>
      <button type="button" className="btn btn-primary cookie-notice-btn" onClick={dismiss}>
        {t.ok}
      </button>
    </div>
  );
}
