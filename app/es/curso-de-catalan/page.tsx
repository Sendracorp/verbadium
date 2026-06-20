import type { Metadata } from 'next';
import LocalizedCourse from '@/components/marketing/LocalizedCourse';
import { getDict, hreflang, PATHS } from '@/lib/i18n';
const d = getDict('es');

export const metadata: Metadata = {
  title: d.course.metaTitle,
  description: d.course.metaDesc,
  alternates: { canonical: PATHS.course.es, languages: hreflang('course') },
  openGraph: { title: `${d.course.metaTitle} — Verbadium`, description: d.course.metaDesc, url: PATHS.course.es, locale: 'es_ES' },
};

export default function Page() { return <LocalizedCourse lang="es" />; }
