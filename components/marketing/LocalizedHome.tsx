import Link from 'next/link';
import SiteHeader from '../SiteHeader';
import SiteFooter from '../SiteFooter';
import SetMedium from '../SetMedium';
import { getDict, PATHS, type Locale } from '@/lib/i18n';
import { getCourseMeta } from '@/lib/courses';

/* Localized marketing home (catalog) for ca/es/fr. The course card links to
   the localized course landing; the course itself is taught in English. */
export default function LocalizedHome({ lang }: { lang: Locale }) {
  const d = getDict(lang);
  const meta = getCourseMeta('catalan-a1')!;
  return (
    <div lang={lang}>
      <SetMedium lang={lang} />
      <SiteHeader lang={lang} page="home" />
      <main className="site-main">
        <div className="hero">
          <div className="badge">{d.home.badge}</div>
          <h1>{d.home.h1}</h1>
          <p className="hero-sub">{d.home.sub}</p>
        </div>
        <div className="catalog-grid">
          <Link className="card course-card" href={(PATHS.course as Record<string, string>)[lang]} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="course-card-head"><span className="badge">{meta.language} · {meta.level}</span></div>
            <h2>{d.course.name}</h2>
            <p>{d.course.tagline}</p>
            <p className="course-card-meta">{meta.priceLabel} · {d.card.lifetime}</p>
            <div className="course-card-actions">
              <span className="btn btn-primary">{d.home.seeCourse}</span>
            </div>
          </Link>
        </div>
      </main>
      <SiteFooter lang={lang} page="home" />
    </div>
  );
}
