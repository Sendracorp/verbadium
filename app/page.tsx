import { getCourse } from '@/lib/course';
import Dashboard from '@/components/Dashboard';
import Checklist from '@/components/Checklist';
import SpeechScope from '@/components/SpeechScope';

export default function HomePage() {
  const course = getCourse();
  const units = course.units.map(u => ({ num: u.num, title: u.title, exerciseIds: u.exerciseIds }));
  return (
    <>
      <div className="hero">
        <div className="badge">CEFR · LEVEL A1 · EXAM PREPARATION</div>
        <h1>Catalan from Scratch</h1>
        <p className="hero-sub">
          A complete beginner&apos;s course in Central Catalan for English-speaking adults — built to pass the official A1 exam.
        </p>
        <p className="hero-meta">
          {course.counts.units} progressive units · 300+ words with full IPA · {course.counts.exercises} interactive
          exercises · full mock A1 exam · complete glossary ({course.counts.glossary} entries)
        </p>
      </div>
      <Dashboard units={units} />
      <div className="card">
        <SpeechScope html={course.introHtml} />
      </div>
      <Checklist items={course.checklist} footHtml={course.checklistFootHtml} citeHtml={course.citeHtml} />
    </>
  );
}
