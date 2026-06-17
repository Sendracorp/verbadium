import type { Metadata } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import './globals.css';

// Display: Bricolage Grotesque (characterful, modern). Body: Hanken Grotesk
// (warm, highly legible). Deliberately not Inter/Roboto/system.
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Verbadium — interactive language courses', template: '%s — Verbadium' },
  description: 'Verbadium — interactive language courses: full IPA, native-speaker audio, auto-marked exercises, mock exams and progress tracking. First course: Catalan A1.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
