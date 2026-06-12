import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { getCourseMeta } from '@/lib/courses';
import { getCourseAccess } from '@/lib/access';
import Glossary from '@/components/Glossary';
import Paywall from '@/components/Paywall';

export const metadata: Metadata = { title: 'Glossary' };

export default async function GlossaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getCourseMeta(slug);
  const course = getCourseContent(slug);
  if (!meta || !course) notFound();

  const access = await getCourseAccess(slug);
  if (!access.owns) {
    return <Paywall meta={meta} what="The glossary" loggedIn={!!access.user} returnTo={`/courses/${slug}/glossary`} />;
  }
  return <Glossary rows={course.glossary} />;
}
