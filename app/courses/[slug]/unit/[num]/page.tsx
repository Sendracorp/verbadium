import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { tUI } from '@/lib/ui';
import { mediumForSlug } from '@/lib/courses';
import { canAccessUnit, getCourseAccess, getViewableCourse } from '@/lib/access';
import SpeechScope from '@/components/SpeechScope';
import ExerciseCard from '@/components/exercises';
import Paywall from '@/components/Paywall';

type Params = Promise<{ slug: string; num: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, num } = await params;
  const unit = getCourseContent(slug)?.units.find(u => u.num === +num);
  return { title: unit ? `Unit ${unit.num} · ${unit.title.replace(/<[^>]+>/g, '')}` : 'Unit' };
}

export default async function UnitPage({ params }: { params: Params }) {
  const { slug, num } = await params;
  const meta = await getViewableCourse(slug);    // pre-launch courses: owners/admins only
  const medium = mediumForSlug(slug);            // the variant's teaching language
  const access = await getCourseAccess(slug);
  const course = getCourseContent(slug);
  if (!meta || !course) notFound();
  const unit = course.units.find(u => u.num === +num);
  if (!unit) notFound();
  if (!canAccessUnit(slug, unit.num, access)) {
    return (
      <Paywall
        meta={meta} what={tUI(medium, 'nav.unit', { n: unit.num })} locale={medium}
        loggedIn={!!access.user} returnTo={`/courses/${slug}/unit/${unit.num}`}
      />
    );
  }

  const base = `/courses/${slug}`;
  const last = course.units[course.units.length - 1].num;
  const prev = unit.num === 1
    ? { href: `${base}/ipa`, label: tUI(medium, 'nav.ipa') }
    : { href: `${base}/unit/${unit.num - 1}`, label: tUI(medium, 'nav.unit', { n: unit.num - 1 }) };
  const next = unit.num === last
    ? { href: `${base}/exam`, label: tUI(medium, 'nav.exam') }
    : { href: `${base}/unit/${unit.num + 1}`, label: tUI(medium, 'nav.unit', { n: unit.num + 1 }) };

  let exHeaderShown = false;
  return (
    <>
      {!access.owns && (
        <div
          className="preview-banner" data-test="preview-banner"
          dangerouslySetInnerHTML={{ __html: tUI(medium, 'banner.preview') + (access.user ? '' : tUI(medium, 'banner.previewKeep')) + '.' }}
        />
      )}
      <div className="unit-head">
        <div className="unit-num">{tUI(medium, 'nav.unit', { n: unit.num })}</div>
        <h2 dangerouslySetInnerHTML={{ __html: unit.title }} />
      </div>
      {unit.blocks.map((b, i) => {
        if (b.kind === 'html') return <SpeechScope key={i} html={b.html} />;
        const head = !exHeaderShown
          ? (exHeaderShown = true, <h2 className="ex-section-head" key={`h${i}`}>{tUI(medium, 'ex.section')}</h2>)
          : null;
        return (
          <span key={i} style={{ display: 'contents' }}>
            {head}
            <ExerciseCard ex={b.ex} />
          </span>
        );
      })}
      <div className="pager">
        <Link href={prev.href}>← {prev.label}</Link>
        <Link href={next.href}>{next.label} →</Link>
      </div>
    </>
  );
}
