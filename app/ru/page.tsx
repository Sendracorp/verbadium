import type { Metadata } from 'next';
import LocalizedHome from '@/components/marketing/LocalizedHome';
import { getDict, hreflang, PATHS } from '@/lib/i18n';
const d = getDict('ru');

export const metadata: Metadata = {
  title: d.home.h1,
  description: d.course.metaDesc,
  alternates: { canonical: PATHS.home.ru, languages: hreflang('home') },
  openGraph: { title: `${d.home.h1} — Verbadium`, description: d.course.metaDesc, url: PATHS.home.ru, locale: 'ru_RU' },
};

export default function Page() { return <LocalizedHome lang="ru" />; }
