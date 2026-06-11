import type { Metadata } from 'next';
import { getCourse } from '@/lib/course';
import Mock from '@/components/Mock';

export const metadata: Metadata = { title: 'Mock A1 Exam' };

export default function MockPage() {
  return <Mock mock={getCourse().mock} />;
}
