import type { Metadata } from 'next';
import { getCourse } from '@/lib/course';
import SpeechScope from '@/components/SpeechScope';

export const metadata: Metadata = { title: 'The Official A1 Exam' };

export default function ExamPage() {
  return (
    <div className="card">
      <SpeechScope html={getCourse().examInfoHtml} />
    </div>
  );
}
