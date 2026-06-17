'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { exState, subscribe } from '@/lib/progress';
import AccountMenu from './AccountMenu';
import Logo from './Logo';

export interface UnitMeta { num: number; title: string; exerciseIds: string[] }

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

const stripHtml = (s: string) =>
  s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

function titleFor(path: string, units: UnitMeta[]): string {
  if (path === '' || path === '/') return 'Home & progress';
  if (path === '/ipa') return 'Reading the IPA';
  if (path === '/exam') return 'The Official A1 Exam';
  if (path === '/mock') return 'Mock A1 Exam';
  if (path === '/glossary') return 'Glossary';
  const um = path.match(/^\/unit\/(\d+)/);
  if (um) {
    const u = units.find(x => x.num === Number(um[1]));
    return u ? `Unit ${u.num} · ${stripHtml(u.title)}` : `Unit ${um[1]}`;
  }
  return 'Verbadium';
}

export default function Sidebar({ units, courseSlug, courseLanguage, courseLevel, owns, freeUnits, userEmail, isAdmin = false }: {
  units: UnitMeta[];
  courseSlug: string;
  courseLanguage: string;
  courseLevel: string;
  owns: boolean;
  freeUnits: number[];
  userEmail: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname() ?? '/';
  const base = `/courses/${courseSlug}`;
  const sub = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const pageTitle = titleFor(sub, units);
  const [open, setOpen] = useState(false);          // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop rail
  const progress = useUnitProgress(units);

  // restore the desktop collapsed preference
  useEffect(() => {
    setCollapsed(localStorage.getItem('vb-nav-collapsed') === '1');
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
  }, [open]);
  useEffect(() => {
    document.body.classList.toggle('nav-collapsed', collapsed);
    return () => document.body.classList.remove('nav-collapsed');
  }, [collapsed]);

  function toggleCollapse() {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem('vb-nav-collapsed', next ? '1' : '0');
      return next;
    });
  }

  const cls = (href: string, extra = '') =>
    `${extra}${pathname === href ? ' current' : ''}`.trim();

  return (
    <>
      <header className="topbar">
        <button
          className="nav-toggle" id="navToggle" aria-label="Open menu"
          aria-expanded={open} onClick={() => setOpen(o => !o)}
        >☰</button>
        <button
          className="nav-collapse" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed} onClick={toggleCollapse}
        >{collapsed ? '»' : '«'}</button>
        <Link href={base} className="topbar-logo" aria-label="Verbadium home"><Logo size={30} /></Link>
        <span className="topbar-title">{pageTitle}</span>
        <div className="topbar-right">
          {userEmail
            ? <AccountMenu userEmail={userEmail} isAdmin={isAdmin} />
            : <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-primary topbar-login" data-test="nav-login">Log in</Link>}
        </div>
      </header>
      <nav className="sidebar" id="sidebar" aria-label="Course navigation">
        <div className="nav-brand">
          <Link href={base}>Verbadium<br /><span>{courseLanguage} · {courseLevel}</span></Link>
        </div>
        <div className="nav-group">
          <Link href={base} className={cls(base)}>Home &amp; progress</Link>
          <Link href={`${base}/ipa`} className={cls(`${base}/ipa`)}>IPA guide</Link>
        </div>
        <div className="nav-group nav-units">
          {units.map(u => {
            const locked = !owns && !freeUnits.includes(u.num);
            const p = progress(u);
            return (
              <Link key={u.num} href={`${base}/unit/${u.num}`} className={cls(`${base}/unit/${u.num}`, 'nav-unit')}>
                <span className="nav-unit-text">
                  <span className="nav-unit-num">Unit {u.num}</span>
                  <span className="nav-unit-title" dangerouslySetInnerHTML={{ __html: u.title }} />
                </span>
                {locked ? (
                  <span className="nav-badge nav-lock" data-unit={u.num} aria-label="Locked">🔒</span>
                ) : (
                  <span className={`nav-badge${p.passed === p.total ? ' done' : ''}`} data-unit={u.num}>
                    {p.passed}/{p.total}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="nav-group">
          <Link href={`${base}/exam`} className={cls(`${base}/exam`)}>The official exam</Link>
          <Link href={`${base}/mock`} className={cls(`${base}/mock`)}>
            Mock exam{!owns && <span className="nav-badge nav-lock" aria-label="Locked">🔒</span>}
          </Link>
          <Link href={`${base}/glossary`} className={cls(`${base}/glossary`)}>
            Glossary{!owns && <span className="nav-badge nav-lock" aria-label="Locked">🔒</span>}
          </Link>
        </div>
        <div className="nav-group nav-account">
          <Link href="/">All courses</Link>
        </div>
      </nav>
      <div className="backdrop" id="backdrop" onClick={() => setOpen(false)} />
    </>
  );
}
