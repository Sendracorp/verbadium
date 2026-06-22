import Link from 'next/link';
import CourseMenuButton from './CourseMenuButton';
import AccountMenu from './AccountMenu';
import { tUI } from '@/lib/ui';
import type { Locale } from '@/lib/i18n';

/* Mobile-only course app-bar (desktop hides it — the sidebar carries identity
   + account there). Menu toggle on the left; account / conversion on the right.
   No marketing nav: owners get a clean bar, non-owners keep a "Get the course"
   CTA so the purchase path stays visible. */
export default function CourseTopbar({ userEmail, isAdmin = false, owns, courseSlug, locale = 'en' }: {
  userEmail: string | null; isAdmin?: boolean; owns: boolean; courseSlug: string; locale?: Locale;
}) {
  return (
    <div className="course-topbar">
      <CourseMenuButton />
      <div className="course-topbar-right">
        {!owns && <Link href="/pricing" className="course-topbar-cta">{tUI(locale, 'nav.getCourse')}</Link>}
        {userEmail ? (
          <AccountMenu userEmail={userEmail} isAdmin={isAdmin} />
        ) : (
          <Link href={`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`} className="course-topbar-login">{tUI(locale, 'auth.login')}</Link>
        )}
      </div>
    </div>
  );
}
