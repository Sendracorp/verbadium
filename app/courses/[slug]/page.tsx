import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { getCourseMeta } from '@/lib/courses';
import { getCourseAccess } from '@/lib/access';
import Dashboard from '@/components/Dashboard';
import Checklist from '@/components/Checklist';
import SpeechScope from '@/components/SpeechScope';
import BuyButton from '@/components/BuyButton';

export default async function CourseHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getCourseMeta(slug);
  const course = getCourseContent(slug);
  if (!meta || !course) notFound();

  const access = await getCourseAccess(slug);
  const units = course.units.map(u => ({ num: u.num, title: u.title, exerciseIds: u.exerciseIds }));
  const base = `/courses/${slug}`;

  const hero = (
    <div className="hero">
      <div className="badge">CEFR · LEVEL {meta.level} · EXAM PREPARATION</div>
      <h1>{meta.title.replace(` (${meta.level})`, '')}</h1>
      <p className="hero-sub">{meta.tagline}</p>
      <p className="hero-meta">{meta.description}</p>
    </div>
  );

  if (!access.owns) {
    const previewUnit = meta.freeUnits[0];
    return (
      <>
        {hero}
        <div className="card sales" data-test="sales-page">
          <h2>Get the full course — {meta.priceLabel}, yours forever</h2>
          <ul className="sales-list">
            <li>All {meta.stats.units} units with {meta.stats.exercises} interactive, auto-marked exercises</li>
            <li>Full mock A1 exam with per-paper timers and attempt history</li>
            <li>Complete glossary ({meta.stats.glossary} entries) with audio and IPA</li>
            <li>Progress saved to your account — continue on any device</li>
            <li>One payment, no subscription</li>
          </ul>
          <div className="paywall-actions">
            <BuyButton courseSlug={slug} priceLabel={meta.priceLabel} returnTo={base} />
            {!access.user && (
              <Link className="btn" href={`/login?next=${encodeURIComponent(base)}`}>
                Already bought it? Log in
              </Link>
            )}
          </div>
          <p className="paywall-preview">
            Try before you buy: <Link href={`${base}/unit/${previewUnit}`} data-test="preview-link">Unit {previewUnit} is free</Link>
            {' '}— along with the <Link href={`${base}/ipa`}>IPA guide</Link> and{' '}
            <Link href={`${base}/exam`}>exam information</Link>. No account needed.
          </p>
        </div>
        <div className="card">
          <SpeechScope html={course.introHtml} />
        </div>
      </>
    );
  }

  return (
    <>
      {hero}
      <Dashboard units={units} base={base} />
      <div className="card">
        <SpeechScope html={course.introHtml} />
      </div>
      <Checklist items={course.checklist} footHtml={course.checklistFootHtml} citeHtml={course.citeHtml} />
    </>
  );
}
