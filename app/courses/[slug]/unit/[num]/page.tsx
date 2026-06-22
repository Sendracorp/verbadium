import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseContent } from '@/lib/content';
import { getMedium } from '@/lib/medium';
import { getCourseMeta } from '@/lib/courses';
import { canAccessUnit, getCourseAccess } from '@/lib/access';
import SpeechScope from '@/components/SpeechScope';
import ExerciseCard from '@/components/exercises';
import Paywall from '@/components/Paywall';

type Params = Promise<{ slug: string; num: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, num } = await params;
  const unit = getCourseContent(slug, await getMedium(slug))?.units.find(u => u.num === +num);
  return { title: unit ? `Unit ${unit.num} · ${unit.title.replace(/<[^>]+>/g, '')}` : 'Unit' };
}

export default async function UnitPage({ params }: { params: Params }) {
  const { slug, num } = await params;
  const meta = getCourseMeta(slug);
  const course = getCourseContent(slug, await getMedium(slug));
  if (!meta || !course) notFound();
  const unit = course.units.find(u => u.num === +num);
  if (!unit) notFound();

  const access = await getCourseAccess(slug);
  if (!canAccessUnit(slug, unit.num, access)) {
    return (
      <Paywall
        meta={meta} what={`Unit ${unit.num}`}
        loggedIn={!!access.user} returnTo={`/courses/${slug}/unit/${unit.num}`}
      />
    );
  }

  const base = `/courses/${slug}`;
  const last = course.units[course.units.length - 1].num;
  const prev = unit.num === 1
    ? { href: `${base}/ipa`, label: 'IPA guide' }
    : { href: `${base}/unit/${unit.num - 1}`, label: `Unit ${unit.num - 1}` };
  const next = unit.num === last
    ? { href: `${base}/exam`, label: 'The official exam' }
    : { href: `${base}/unit/${unit.num + 1}`, label: `Unit ${unit.num + 1}` };

  let exHeaderShown = false;
  return (
    <>
      {!access.owns && (
        <div className="preview-banner" data-test="preview-banner">
          You’re viewing the <b>free preview</b>. Your answers are saved on this device
          {access.user ? '' : ' — create an account to keep them'}.
        </div>
      )}
      <div className="unit-head">
        <div className="unit-num">Unit {unit.num}</div>
        <h2 dangerouslySetInnerHTML={{ __html: unit.title }} />
      </div>
      {unit.blocks.map((b, i) => {
        if (b.kind === 'html') return <SpeechScope key={i} html={b.html} />;
        const head = !exHeaderShown
          ? (exHeaderShown = true, <h2 className="ex-section-head" key={`h${i}`}>Exercises</h2>)
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
