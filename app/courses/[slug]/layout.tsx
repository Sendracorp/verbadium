import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import CourseTopbar from '@/components/CourseTopbar';
import CharStrip from '@/components/CharStrip';
import IpaDrawer from '@/components/IpaDrawer';
import GlossaryDrawer from '@/components/GlossaryDrawer';
import ProgressProvider from '@/components/ProgressProvider';
import AudioOverridesProvider from '@/components/AudioOverridesProvider';
import { CourseLocaleProvider } from '@/components/CourseLocale';
import MediumSwitcher from '@/components/MediumSwitcher';
import SiteFooter from '@/components/SiteFooter';
import { getAudioOverrides } from '@/lib/audio-overrides';
import { getCourseContent } from '@/lib/content';
import { uiDict } from '@/lib/ui';
import { getDict } from '@/lib/i18n';
import { getCourseMeta, mediumForSlug, courseFamilies } from '@/lib/courses';
import { getCourseAccess, isUserAdmin } from '@/lib/access';
import { loadInitialProgress } from '@/lib/progress-server';

export default async function CourseLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getCourseMeta(slug);
  const medium = mediumForSlug(slug);            // the variant's teaching language
  const access = await getCourseAccess(slug);
  const course = getCourseContent(slug);
  if (!meta || !course) notFound();

  // Sibling language variants of this course, for the in-course switcher.
  const siblings = (courseFamilies().find(f => f.family === meta.family)?.variants ?? [])
    .map(v => ({ medium: v.medium, slug: v.slug }));

  // Admin check, saved progress and audio overrides don't depend on one another
  // — fan them out instead of awaiting in series.
  const userId = access.user?.id ?? null;
  const [isAdmin, initial, audioOverrides] = await Promise.all([
    userId ? isUserAdmin(userId) : Promise.resolve(false),
    userId ? loadInitialProgress(userId, slug) : Promise.resolve({} as Record<string, unknown>),
    getAudioOverrides(slug),
  ]);
  const units = course.units.map(u => ({ num: u.num, title: u.title, exerciseIds: u.exerciseIds }));

  return (
    <CourseLocaleProvider locale={medium} dict={uiDict(medium)}>
    <ProgressProvider userId={access.user?.id ?? null} courseSlug={slug} initial={initial}>
      <AudioOverridesProvider map={audioOverrides} />
      <CourseTopbar userEmail={access.user?.email ?? null} isAdmin={isAdmin} owns={access.owns} courseSlug={slug} locale={medium} />
      <div className="course-shell">
        <Sidebar
          units={units}
          courseSlug={slug}
          courseLanguage={getDict(medium).course.subject}
          courseLevel={meta.level}
          owns={access.owns}
          freeUnits={meta.freeUnits}
          userEmail={access.user?.email ?? null}
          isAdmin={isAdmin}
        />
        <main className="content">
          <MediumSwitcher current={medium} variants={siblings} />
          {children}
        </main>
      </div>
      <SiteFooter />
      <IpaDrawer html={course.ipaCheatHtml} />
      {access.owns && <GlossaryDrawer rows={course.glossary} base={`/courses/${slug}`} />}
      <CharStrip />
    </ProgressProvider>
    </CourseLocaleProvider>
  );
}
