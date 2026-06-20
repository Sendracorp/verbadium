import type { Metadata } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import JsonLd from '@/components/JsonLd';
import { SITE } from '@/lib/site';

// Display: Bricolage Grotesque (characterful, modern). Body: Hanken Grotesk
// (warm, highly legible). Deliberately not Inter/Roboto/system.
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Verbadium — Learn Catalan online (A1 exam course)',
    template: '%s — Verbadium',
  },
  description:
    'Learn Catalan online with Verbadium: an interactive Central Catalan A1 course built to pass the official exam (Certificat de nivell inicial de català) — full IPA, native-speaker audio, 100+ auto-marked exercises, a mock exam and progress tracking. Free preview, no account needed.',
  keywords: [
    'Catalan course', 'learn Catalan', 'Catalan A1', 'Catalan online course', 'Catalan for beginners',
    'Central Catalan', 'Catalan exam', 'Certificat de nivell inicial de català', 'curs de català',
    'aprende catalán', 'Catalan course Andorra', 'Catalan A1 exam', 'Catalan pronunciation IPA',
  ],
  applicationName: SITE.brand,
  category: 'education',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', siteName: SITE.brand, url: SITE_URL, locale: 'en',
    title: 'Verbadium — Learn Catalan online (A1 exam course)',
    description:
      'Interactive Central Catalan A1 course to pass the official exam — IPA, native-speaker audio, 100+ exercises, mock exam. Free preview.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verbadium — Learn Catalan online (A1 exam course)',
    description: 'Interactive Catalan A1 course for the official exam — audio, IPA, 100+ exercises. Free preview.',
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
};

const ORG_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE.brand,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    email: SITE.email,
    description: 'Online interactive language courses. First course: Catalan (CEFR A1) for the official exam.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.brand,
    url: SITE_URL,
    inLanguage: 'en',
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <JsonLd data={ORG_JSONLD} />
        {children}
      </body>
    </html>
  );
}
