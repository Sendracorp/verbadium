import type { Metadata } from 'next';
import LocalizedCourse from '@/components/marketing/LocalizedCourse';
import { getDict, hreflang, PATHS } from '@/lib/i18n';
const d = getDict('de');

export const metadata: Metadata = {
  title: d.course.metaTitle,
  description: d.course.metaDesc,
  alternates: { canonical: PATHS.course.de, languages: hreflang('course') },
  openGraph: { title: `${d.course.metaTitle} — Verbadium`, description: d.course.metaDesc, url: PATHS.course.de, locale: 'de_DE' },
};

export default function Page() { return <LocalizedCourse lang="de" />; }
