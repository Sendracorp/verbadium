import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import CharStrip from '@/components/CharStrip';
import IpaDrawer from '@/components/IpaDrawer';
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
  const initial = access.user ? await loadInitialProgress(access.user.id, slug) : {};
  const units = course.units.map(u => ({ num: u.num, title: u.title, exerciseIds: u.exerciseIds }));

  let isAdmin = false;
  if (access.user) {
    const supabase = await getServerSupabase();
    const { data: profile } = await supabase!
      .from('profiles').select('is_admin').eq('id', access.user.id).maybeSingle();
    isAdmin = !!profile?.is_admin;
  }

  return (
    <ProgressProvider userId={access.user?.id ?? null} courseSlug={slug} initial={initial}>
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
      <main className="content">
        {children}
        <SiteFooter />
      </main>
      <IpaDrawer html={course.ipaCheatHtml} />
      <CharStrip />
    </ProgressProvider>
  );
}
