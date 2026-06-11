import type { Metadata } from 'next';
import { getCourse } from '@/lib/course';
import Glossary from '@/components/Glossary';

export const metadata: Metadata = { title: 'Glossary' };

export default function GlossaryPage() {
  return <Glossary rows={getCourse().glossary} />;
}
