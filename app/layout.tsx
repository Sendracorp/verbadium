import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Verbadium — interactive language courses', template: '%s — Verbadium' },
  description: 'Verbadium — interactive language courses for English-speaking adults: full IPA, native-speaker audio, mock exams and progress tracking. First course: Catalan A1.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
