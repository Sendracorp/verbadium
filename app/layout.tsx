import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import CharStrip from '@/components/CharStrip';
import { getCourse } from '@/lib/course';

export const metadata: Metadata = {
  title: { default: 'Catalan from Scratch (A1)', template: '%s — Catalan from Scratch (A1)' },
  description: 'Interactive Catalan A1 exam-preparation course: 12 units, 83 exercises, full IPA, audio, mock exam and glossary.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const course = getCourse();
  const units = course.units.map(u => ({ num: u.num, exerciseIds: u.exerciseIds }));
  return (
    <html lang="en">
      <body>
        <Sidebar units={units} />
        <main className="content">{children}</main>
        <CharStrip />
      </body>
    </html>
  );
}
