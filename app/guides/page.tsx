import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { GUIDES } from '@/lib/guides';

const DESC = 'Free, practical guides to learning Catalan: a beginner roadmap, the A1 level explained, alphabet and pronunciation, and how Catalan differs from Spanish.';

export const metadata: Metadata = {
  title: 'Catalan learning guides',
  description: DESC,
  alternates: { canonical: '/guides' },
  openGraph: { title: 'Catalan learning guides — Verbadium', description: DESC, url: '/guides', type: 'website', siteName: 'Verbadium', images: ['/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Catalan learning guides — Verbadium', description: DESC, images: ['/opengraph-image'] },
};

export default function GuidesHub() {
  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <div className="hero">
          <div className="badge">GUIDES</div>
          <h1>Learn Catalan — free guides</h1>
          <p className="hero-sub">
            Practical, beginner-friendly guides to learning Catalan — and a clear path
            from your first words to the official A1 level.
          </p>
        </div>
        <div className="guide-list">
          {GUIDES.map(g => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="card guide-card">
              <h2>{g.title}</h2>
              <p>{g.description}</p>
              <span className="guide-meta">{g.readMins} min read</span>
            </Link>
          ))}
        </div>
        <p className="catalog-pricing-link">
          Ready to start? <Link href="/courses/catalan-a1">Explore the Catalan A1 course →</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
