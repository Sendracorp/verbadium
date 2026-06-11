import type { Metadata } from 'next';
import { getCourse } from '@/lib/course';
import SpeechScope from '@/components/SpeechScope';

export const metadata: Metadata = { title: 'Reading the IPA' };

export default function IpaPage() {
  return (
    <div className="card">
      <SpeechScope html={getCourse().ipaGuideHtml} />
    </div>
  );
}
