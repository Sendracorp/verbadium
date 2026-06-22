'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { exState, subscribe } from '@/lib/progress';
import Logo from './Logo';
import SignOutButton from './SignOutButton';
import { useUI } from './CourseLocale';

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
  const [open, setOpen] = useState(false);          // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop rail
  const progress = useUnitProgress(units);
  const t = useUI();

  // restore the desktop collapsed preference
  useEffect(() => {
    setCollapsed(localStorage.getItem('vb-nav-collapsed') === '1');
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);
  // the mobile toggle lives in the topbar (<CourseMenuButton/>); talk via events
  useEffect(() => {
    const toggle = () => setOpen(o => !o);
    window.addEventListener('vb-nav-toggle', toggle);
    return () => window.removeEventListener('vb-nav-toggle', toggle);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    window.dispatchEvent(new CustomEvent('vb-nav-state', { detail: open }));
    return () => document.body.classList.remove('nav-open');
  }, [open]);
  useEffect(() => {
    document.body.classList.toggle('nav-collapsed', collapsed);
    return () => document.body.classList.remove('nav-collapsed');
  }, [collapsed]);

  function collapse(next: boolean) {
    setCollapsed(next);
    localStorage.setItem('vb-nav-collapsed', next ? '1' : '0');
  }

  const cls = (href: string, extra = '') =>
    `${extra}${pathname === href ? ' current' : ''}`.trim();

  return (
    <>
      {/* mobile drawer toggle lives in the topbar — see <CourseMenuButton/> */}
      <nav className="course-nav" id="sidebar" aria-label={t('a11y.courseNav')}>
        <div className="course-nav-head">
          <div className="course-nav-toprow">
            {/* the product (secondary) — back to all courses */}
            <Link href="/" className="course-nav-home" aria-label={t('a11y.allCourses')}><Logo size={22} /></Link>
            {/* collapsed rail: just the mark */}
            <Link href={base} className="course-nav-mark" aria-label={t('a11y.courseHome')}><Logo variant="mark" size={30} /></Link>
            <button
              className="course-nav-collapse"
              aria-label={collapsed ? t('a11y.expand') : t('a11y.collapse')}
              aria-pressed={collapsed}
              onClick={() => collapse(!collapsed)}
            >{collapsed ? '»' : '«'}</button>
          </div>
          {/* this course (primary context) */}
          <Link href={base} className="course-nav-course">
            <span className="course-name">{courseLanguage}</span>
            <span className="course-level">{courseLevel}</span>
          </Link>
        </div>

        <div className="course-nav-scroll">
          <div className="nav-group">
            <Link href={base} className={cls(base)}>{t('nav.home')}</Link>
            <Link href={`${base}/ipa`} className={cls(`${base}/ipa`)}>{t('nav.ipa')}</Link>
          </div>
          <div className="nav-group nav-units">
            {units.map(u => {
              const locked = !owns && !freeUnits.includes(u.num);
              const p = progress(u);
              return (
                <Link key={u.num} href={`${base}/unit/${u.num}`} className={cls(`${base}/unit/${u.num}`, 'nav-unit')}>
                  <span className="nav-unit-text">
                    <span className="nav-unit-num">{t('nav.unit', { n: u.num })}</span>
                    <span className="nav-unit-title" dangerouslySetInnerHTML={{ __html: u.title }} />
                  </span>
                  {locked ? (
                    <span className="nav-badge nav-lock" data-unit={u.num} aria-label={t('a11y.locked')}>🔒</span>
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
            <Link href={`${base}/exam`} className={cls(`${base}/exam`)}>{t('nav.exam')}</Link>
            <Link href={`${base}/mock`} className={cls(`${base}/mock`)}>
              {t('nav.mock')}{!owns && <span className="nav-badge nav-lock" aria-label={t('a11y.locked')}>🔒</span>}
            </Link>
            <Link href={`${base}/glossary`} className={cls(`${base}/glossary`)}>
              {t('nav.glossary')}{!owns && <span className="nav-badge nav-lock" aria-label={t('a11y.locked')}>🔒</span>}
            </Link>
          </div>
        </div>

        {/* pinned base: conversion (non-owners) + account / session */}
        <div className="course-nav-foot">
          {!owns && (
            <Link href="/pricing" className="nav-foot-cta">{t('nav.getFull')}</Link>
          )}
          <Link href="/" className="nav-foot-link nav-foot-courses">{t('nav.allCourses')}</Link>
          {userEmail ? (
            <div className="nav-foot-account">
              <span className="nav-foot-email" title={userEmail}>{userEmail}</span>
              <Link href="/account" className="nav-foot-link">{t('nav.account')}</Link>
              {isAdmin && <Link href="/admin" className="nav-foot-link">{t('nav.admin')}</Link>}
              <SignOutButton className="nav-foot-link nav-foot-signout" />
            </div>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="nav-foot-link nav-foot-auth" data-test="nav-login">{t('auth.login')}</Link>
          )}
        </div>
      </nav>
      <div className="backdrop" id="backdrop" onClick={() => setOpen(false)} />
    </>
  );
}
