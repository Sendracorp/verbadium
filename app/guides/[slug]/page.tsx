import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import JsonLd from '@/components/JsonLd';
import { GUIDES, getGuide } from '@/lib/guides';
import { SITE } from '@/lib/site';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';

export function generateStaticParams() {
  return GUIDES.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  const url = `/guides/${g.slug}`;
  const ogTitle = `${g.metaTitle} — Verbadium`;
  return {
    title: g.metaTitle,
    description: g.description,
    alternates: { canonical: url },
    openGraph: { title: ogTitle, description: g.description, url, type: 'article', siteName: SITE.brand, images: ['/opengraph-image'], publishedTime: g.updated, modifiedTime: g.updated },
    twitter: { card: 'summary_large_image', title: ogTitle, description: g.description, images: ['/opengraph-image'] },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const url = `${SITE_URL}/guides/${g.slug}`;
  const related = g.related.map(getGuide).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: g.title, description: g.description,
      datePublished: g.updated, dateModified: g.updated, inLanguage: 'en',
      author: { '@type': 'Organization', name: SITE.brand, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE.brand, url: SITE_URL },
      mainEntityOfPage: url,
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: g.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Guides', item: `${SITE_URL}/guides` },
        { '@type': 'ListItem', position: 2, name: g.title, item: url },
      ],
    },
  ];

  return (
    <>
      <SiteHeader />
      <JsonLd data={ld} />
      <main className="site-main">
        <article className="guide-article">
          <nav className="guide-crumbs" aria-label="Breadcrumb">
            <Link href="/guides">Guides</Link> <span aria-hidden="true">/</span> <span>{g.title}</span>
          </nav>
          <h1>{g.title}</h1>
          <p className="guide-updated">
            Updated {new Date(g.updated).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })} · {g.readMins} min read
          </p>
          <p className="guide-lead">{g.lead}</p>

          {g.sections.map((s, i) => (
            <section key={i}>
              <h2>{s.h2}</h2>
              <div dangerouslySetInnerHTML={{ __html: s.html }} />
            </section>
          ))}

          <section className="guide-faqs">
            <h2>Frequently asked questions</h2>
            {g.faqs.map((f, i) => (
              <div key={i} className="guide-faq">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>

          <div className="card guide-cta">
            <h2>Start learning Catalan</h2>
            <p>Verbadium’s Catalan A1 course takes you from zero to the official beginner level — native-speaker audio, full IPA, 108 auto-marked exercises and a timed mock exam. One-time €25, lifetime access.</p>
            <div className="paywall-actions">
              <Link className="btn btn-primary" href="/courses/catalan-a1">Go to the course →</Link>
              <Link className="btn" href="/pricing">See pricing</Link>
            </div>
          </div>

          {related.length > 0 && (
            <section className="guide-related">
              <h2>Related guides</h2>
              <ul>
                {related.map(r => <li key={r.slug}><Link href={`/guides/${r.slug}`}>{r.title}</Link></li>)}
              </ul>
            </section>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
