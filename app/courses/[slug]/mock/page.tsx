import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { getCourseMeta } from '@/lib/courses';
import { getCourseAccess } from '@/lib/access';
import Mock from '@/components/Mock';
import Paywall from '@/components/Paywall';

export const metadata: Metadata = { title: 'Mock A1 Exam' };

export default async function MockPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getCourseMeta(slug);
  const course = getCourseContent(slug);
  if (!meta || !course) notFound();

  const access = await getCourseAccess(slug);
  if (!access.owns) {
    return <Paywall meta={meta} what="The mock exam" loggedIn={!!access.user} returnTo={`/courses/${slug}/mock`} />;
  }
  return <Mock mock={course.mock} />;
}
