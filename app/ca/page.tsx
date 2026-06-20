import type { Metadata } from 'next';
import LocalizedHome from '@/components/marketing/LocalizedHome';
import { getDict, hreflang, PATHS } from '@/lib/i18n';
const d = getDict('ca');

export const metadata: Metadata = {
  title: d.home.h1,
  description: d.course.metaDesc,
  alternates: { canonical: PATHS.home.ca, languages: hreflang('home') },
  openGraph: { title: `${d.home.h1} — Verbadium`, description: d.course.metaDesc, url: PATHS.home.ca, locale: 'ca_ES' },
};

export default function Page() { return <LocalizedHome lang="ca" />; }
