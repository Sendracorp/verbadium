'use client';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import { useUI } from './CourseLocale';

/* Course-units menu toggle for mobile: the Verbadium mark *is* the button
   (with a small lines hint so it reads as a menu). The drawer is owned by
   <Sidebar/>, so we toggle it via a window event and mirror open state. */
export default function CourseMenuButton() {
  const t = useUI();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onState = (e: Event) => setOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener('vb-nav-state', onState);
    return () => window.removeEventListener('vb-nav-state', onState);
  }, []);

  return (
    <button
      id="navToggle"
      className="course-menu-btn"
      aria-label={t('a11y.courseMenu')}
      aria-controls="sidebar"
      aria-expanded={open}
      onClick={() => window.dispatchEvent(new CustomEvent('vb-nav-toggle'))}
    >
      <Logo variant="mark" size={32} />
      <svg className="course-menu-hint" width="13" height="11" viewBox="0 0 13 11" aria-hidden="true">
        <rect y="0" width="13" height="1.8" rx="0.9" />
        <rect y="4.6" width="13" height="1.8" rx="0.9" />
        <rect y="9.2" width="13" height="1.8" rx="0.9" />
      </svg>
    </button>
  );
}
