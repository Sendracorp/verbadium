import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourse } from '@/lib/course';
import SpeechScope from '@/components/SpeechScope';
import ExerciseCard from '@/components/exercises';

export function generateStaticParams() {
  return getCourse().units.map(u => ({ num: String(u.num) }));
}

export async function generateMetadata({ params }: { params: Promise<{ num: string }> }): Promise<Metadata> {
  const { num } = await params;
  const unit = getCourse().units.find(u => u.num === +num);
  return { title: unit ? `Unit ${unit.num} · ${unit.title.replace(/<[^>]+>/g, '')}` : 'Unit' };
}

export default async function UnitPage({ params }: { params: Promise<{ num: string }> }) {
  const { num } = await params;
  const course = getCourse();
  const unit = course.units.find(u => u.num === +num);
  if (!unit) notFound();

  const prev = unit.num === 1
    ? { href: '/ipa', label: 'IPA guide' }
    : { href: `/unit/${unit.num - 1}`, label: `Unit ${unit.num - 1}` };
  const next = unit.num === 12
    ? { href: '/exam', label: 'The official exam' }
    : { href: `/unit/${unit.num + 1}`, label: `Unit ${unit.num + 1}` };

  let exHeaderShown = false;
  return (
    <>
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
