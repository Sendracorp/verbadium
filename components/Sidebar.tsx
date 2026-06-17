'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { exState, subscribe } from '@/lib/progress';
import { getBrowserSupabase } from '@/lib/supabase/client';

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

function titleFor(path: string): string {
  if (path === '' || path === '/') return 'Home & progress';
  if (path === '/ipa') return 'Reading the IPA';
  if (path === '/exam') return 'The Official A1 Exam';
  if (path === '/mock') return 'Mock A1 Exam';
  if (path === '/glossary') return 'Glossary';
  const um = path.match(/^\/unit\/(\d+)/);
  if (um) return `Unit ${um[1]}`;
  return 'Verbadium';
}

export default function Sidebar({ units, courseSlug, courseLanguage, courseLevel, owns, freeUnits, userEmail }: {
  units: UnitMeta[];
  courseSlug: string;
  courseLanguage: string;
  courseLevel: string;
  owns: boolean;
  freeUnits: number[];
  userEmail: string | null;
}) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const base = `/courses/${courseSlug}`;
  const sub = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const pageTitle = titleFor(sub);
  const [open, setOpen] = useState(false);
  const progress = useUnitProgress(units);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
  }, [open]);

  const cls = (href: string, extra = '') =>
    `${extra}${pathname === href ? ' current' : ''}`.trim();

  async function signOut() {
    await getBrowserSupabase()?.auth.signOut();
    router.push('/');
    router.refresh();
  }

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
                <span className="nav-unit-label">Unit {u.num}</span>
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
          {userEmail ? (
            <>
              <Link href="/account" className={cls('/account')} title={userEmail}>
                <span className="nav-email">{userEmail}</span>
              </Link>
              <button type="button" className="nav-signout" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} data-test="nav-login">Log in</Link>
          )}
        </div>
      </nav>
      <div className="backdrop" id="backdrop" onClick={() => setOpen(false)} />
    </>
  );
}
