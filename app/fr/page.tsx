import type { Metadata } from 'next';
import LocalizedHome from '@/components/marketing/LocalizedHome';
import { getDict, hreflang, PATHS } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
const d = getDict('fr');

export const metadata: Metadata = {
  title: d.home.h1,
  description: d.course.metaDesc,
  alternates: { canonical: PATHS.home.fr, languages: hreflang('home') },
  openGraph: { title: `${d.home.h1} — Verbadium`, description: d.course.metaDesc, url: PATHS.home.fr, locale: 'fr_FR' },
};

export default function Page() { return <LocalizedHome lang="fr" />; }
