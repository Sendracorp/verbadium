import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { getMedium } from '@/lib/medium';
import SpeechScope from '@/components/SpeechScope';

export const metadata: Metadata = { title: 'Reading the IPA' };

export default async function IpaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourseContent(slug, await getMedium(slug));
  if (!course) notFound();
  return (
    <div className="card">
      <SpeechScope html={course.ipaGuideHtml} />
    </div>
  );
}
