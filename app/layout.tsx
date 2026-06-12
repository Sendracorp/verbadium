import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Català from Scratch', template: '%s — Català from Scratch' },
  description: 'Interactive Catalan courses for English-speaking adults: full IPA, audio, mock exams and progress tracking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
