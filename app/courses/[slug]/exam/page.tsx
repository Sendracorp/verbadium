import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { getMedium } from '@/lib/medium';
import SpeechScope from '@/components/SpeechScope';

export const metadata: Metadata = { title: 'The Official A1 Exam' };

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourseContent(slug, await getMedium(slug));
  if (!course) notFound();
  return (
    <div className="card">
      <SpeechScope html={course.examInfoHtml} />
    </div>
  );
}
