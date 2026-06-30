import Link from 'next/link';
import { SITE } from '@/lib/site';
import Logo from './Logo';
import LangSwitcher from './LangSwitcher';
import { getDict, PATHS, type Locale, type PageKey } from '@/lib/i18n';

/* Branded footer (deep teal panel). Keeps the verification links Paddle's
   domain review expects, plus brand + legal/MoR line and a language switcher.
   English defaults so existing pages render unchanged. */
export default function SiteFooter({ lang = 'en', page = 'home' }: { lang?: Locale; page?: PageKey } = {}) {
  const year = SITE.lastUpdated.slice(-4);
  const d = getDict(lang);
  return (
    <footer className="site-footer" data-test="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <Logo size={34} />
          <p className="footer-tagline">{d.footer.tagline}</p>
          <a className="footer-mail" href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>
        <nav className="footer-cols" aria-label="Footer">
          <div className="footer-col">
            <h4>{d.footer.learn}</h4>
            <Link href={lang === 'en' ? '/' : (PATHS.course as Record<string, string>)[lang]}>{lang === 'en' ? 'Courses' : d.nav.course}</Link>
            <Link href={(PATHS.pricing as Record<string, string>)[lang]}>{d.nav.pricing}</Link>
            {lang === 'en' && <Link href="/guides">Guides</Link>}
          </div>
          <div className="footer-col">
            <h4>{d.footer.legal}</h4>
            <Link href="/terms">{d.footer.terms}</Link>
            <Link href="/refunds">{d.footer.refunds}</Link>
            <Link href="/privacy">{d.footer.privacy}</Link>
            <Link href="/cookies">{d.footer.cookies}</Link>
          </div>
          <div className="footer-col">
            <h4>{d.footer.help}</h4>
            <Link href="/contact">{d.footer.contact}</Link>
          </div>
        </nav>
      </div>
      <LangSwitcher lang={lang} page={page} />
      <div className="site-footer-bottom">
        <span>© {year} {SITE.legalName}</span>
        <span>{d.footer.mor}</span>
      </div>
    </footer>
  );
}
