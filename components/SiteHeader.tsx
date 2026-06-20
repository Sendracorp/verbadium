import Link from 'next/link';
import Logo from './Logo';
import HeaderNav from './HeaderNav';
import AccountSlot from './AccountSlot';
import { PATHS, type Locale, type PageKey } from '@/lib/i18n';

/* Floating pill header for the public/marketing pages. Fully static — the
   account state resolves client-side (<AccountSlot/>) so these pages can be
   prerendered. `lang`/`page` localize the nav + brand link. */
export default function SiteHeader({ lang = 'en', page = 'home' }: { lang?: Locale; page?: PageKey } = {}) {
  return (
    <header className="site-header">
      <Link href={PATHS.home[lang]} className="site-brand vb-chip" aria-label="Verbadium home"><Logo size={40} /></Link>
      <HeaderNav lang={lang} page={page} />
      <AccountSlot lang={lang} />
    </header>
  );
}
