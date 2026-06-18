import Link from 'next/link';
import CourseMenuButton from './CourseMenuButton';
import AccountMenu from './AccountMenu';

/* Mobile-only course app-bar (desktop hides it — the sidebar carries identity
   + account there). Menu toggle on the left; account / conversion on the right.
   No marketing nav: owners get a clean bar, non-owners keep a "Get the course"
   CTA so the purchase path stays visible. */
export default function CourseTopbar({ userEmail, isAdmin = false, owns, courseSlug }: {
  userEmail: string | null; isAdmin?: boolean; owns: boolean; courseSlug: string;
}) {
  return (
    <div className="course-topbar">
      <CourseMenuButton />
      <div className="course-topbar-right">
        {!owns && <Link href="/pricing" className="course-topbar-cta">Get the course</Link>}
        {userEmail ? (
          <AccountMenu userEmail={userEmail} isAdmin={isAdmin} />
        ) : (
          <Link href={`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`} className="course-topbar-login">Log in</Link>
        )}
      </div>
    </div>
  );
}
