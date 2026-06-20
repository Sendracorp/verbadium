import type { Metadata } from 'next';
import LocalizedCourse from '@/components/marketing/LocalizedCourse';
import { getDict, hreflang, PATHS } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
const d = getDict('ca');

export const metadata: Metadata = {
  title: d.course.metaTitle,
  description: d.course.metaDesc,
  alternates: { canonical: PATHS.course.ca, languages: hreflang('course') },
  openGraph: { title: `${d.course.metaTitle} — Verbadium`, description: d.course.metaDesc, url: PATHS.course.ca, locale: 'ca_ES' },
};

export default function Page() { return <LocalizedCourse lang="ca" />; }
