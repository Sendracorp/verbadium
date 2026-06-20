import Link from 'next/link';
import { LOCALES, LOCALE_LABEL, PATHS, type Locale, type PageKey } from '@/lib/i18n';

/* Footer language switcher — maps the current page to its equivalent in each
   locale (also a visible reciprocal of the <head> hreflang links). */
export default function LangSwitcher({ lang, page }: { lang: Locale; page: PageKey }) {
  return (
    <div className="lang-switcher" aria-label="Language / Idioma">
      {LOCALES.map(l => (
        <Link
          key={l} href={PATHS[page][l]} hrefLang={l}
          aria-current={l === lang ? 'true' : undefined}
          className={l === lang ? 'active' : ''}
        >{LOCALE_LABEL[l]}</Link>
      ))}
    </div>
  );
}
