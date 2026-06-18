import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import CourseTopbar from '@/components/CourseTopbar';
import CharStrip from '@/components/CharStrip';
import IpaDrawer from '@/components/IpaDrawer';
import GlossaryDrawer from '@/components/GlossaryDrawer';
import ProgressProvider from '@/components/ProgressProvider';
import SiteFooter from '@/components/SiteFooter';
import { getCourseContent } from '@/lib/content';
import { getCourseMeta } from '@/lib/courses';
import { getCourseAccess } from '@/lib/access';
import { getServerSupabase } from '@/lib/supabase/server';
import { loadInitialProgress } from '@/lib/progress-server';

export default async function CourseLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getCourseMeta(slug);
  const course = getCourseContent(slug);
  if (!meta || !course) notFound();

  const access = await getCourseAccess(slug);
  let isAdmin = false;
  if (access.user) {
    const supabase = await getServerSupabase();
    const { data: profile } = await supabase!
      .from('profiles').select('is_admin').eq('id', access.user.id).maybeSingle();
    isAdmin = !!profile?.is_admin;
  }
  const initial = access.user ? await loadInitialProgress(access.user.id, slug) : {};
  const units = course.units.map(u => ({ num: u.num, title: u.title, exerciseIds: u.exerciseIds }));

  return (
    <ProgressProvider userId={access.user?.id ?? null} courseSlug={slug} initial={initial}>
      <CourseTopbar userEmail={access.user?.email ?? null} isAdmin={isAdmin} owns={access.owns} courseSlug={slug} />
      <div className="course-shell">
        <Sidebar
          units={units}
          courseSlug={slug}
          courseLanguage={meta.language}
          courseLevel={meta.level}
          owns={access.owns}
          freeUnits={meta.freeUnits}
          userEmail={access.user?.email ?? null}
          isAdmin={isAdmin}
        />
        <main className="content">{children}</main>
      </div>
      <SiteFooter />
      <IpaDrawer html={course.ipaCheatHtml} />
      {access.owns && <GlossaryDrawer rows={course.glossary} base={`/courses/${slug}`} />}
      <CharStrip />
    </ProgressProvider>
  );
}
