'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { exState, subscribe } from '@/lib/progress';

export interface UnitMeta { num: number; exerciseIds: string[] }

function useUnitProgress(units: UnitMeta[]) {
  const [, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);                         // only read storage after hydration
    return subscribe(() => setTick(t => t + 1));
  }, []);
  return (u: UnitMeta) => {
    if (!hydrated) return { passed: 0, total: u.exerciseIds.length };
    let passed = 0;
    for (const id of u.exerciseIds) if (exState(id).state === 'passed') passed++;
    return { passed, total: u.exerciseIds.length };
  };
}

function titleFor(pathname: string): string {
  if (pathname === '/') return 'Catalan A1 — Home';
  if (pathname === '/ipa') return 'Reading the IPA';
  if (pathname === '/exam') return 'The Official A1 Exam';
  if (pathname === '/mock') return 'Mock A1 Exam';
  if (pathname === '/glossary') return 'Glossary';
  const um = pathname.match(/^\/unit\/(\d+)/);
  if (um) return `Unit ${um[1]}`;
  return 'Catalan from Scratch';
}

export default function Sidebar({ units }: { units: UnitMeta[] }) {
  const pathname = usePathname();
  const pageTitle = titleFor(pathname ?? '/');
  const [open, setOpen] = useState(false);
  const progress = useUnitProgress(units);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
  }, [open]);

  const cls = (href: string, extra = '') =>
    `${extra}${pathname === href ? ' current' : ''}`.trim();

  return (
    <>
      <header className="topbar">
        <button
          className="nav-toggle" id="navToggle" aria-label="Menu"
          aria-expanded={open} onClick={() => setOpen(o => !o)}
        >☰</button>
        <span className="topbar-title">{pageTitle}</span>
      </header>
      <nav className="sidebar" id="sidebar" aria-label="Course navigation">
        <div className="nav-brand">
          <Link href="/">Català<br /><span>from Scratch · A1</span></Link>
        </div>
        <div className="nav-group">
          <Link href="/" className={cls('/')}>Home &amp; progress</Link>
          <Link href="/ipa" className={cls('/ipa')}>IPA guide</Link>
        </div>
        <div className="nav-group nav-units">
          {units.map(u => {
            const p = progress(u);
            return (
              <Link key={u.num} href={`/unit/${u.num}`} className={cls(`/unit/${u.num}`, 'nav-unit')}>
                <span className="nav-unit-label">Unit {u.num}</span>
                <span className={`nav-badge${p.passed === p.total ? ' done' : ''}`} data-unit={u.num}>
                  {p.passed}/{p.total}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="nav-group">
          <Link href="/exam" className={cls('/exam')}>The official exam</Link>
          <Link href="/mock" className={cls('/mock')}>Mock exam</Link>
          <Link href="/glossary" className={cls('/glossary')}>Glossary</Link>
        </div>
      </nav>
      <div className="backdrop" id="backdrop" onClick={() => setOpen(false)} />
    </>
  );
}
