import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import CourseTopbar from '@/components/CourseTopbar';
import CharStrip from '@/components/CharStrip';
import IpaDrawer from '@/components/IpaDrawer';
import GlossaryDrawer from '@/components/GlossaryDrawer';
import ProgressProvider from '@/components/ProgressProvider';
import AudioOverridesProvider from '@/components/AudioOverridesProvider';
import { CourseLocaleProvider } from '@/components/CourseLocale';
import SiteFooter from '@/components/SiteFooter';
import { getAudioOverrides } from '@/lib/audio-overrides';
import { getCourseContent, getDisplayGlossary } from '@/lib/content';
import { uiDict } from '@/lib/ui';
import { getDict } from '@/lib/i18n';
import { mediumForSlug, courseFamilies } from '@/lib/courses';
import { getCourseAccess, getViewableCourse, isUserAdmin, ownedCourseSlugs, paywallBypassed } from '@/lib/access';
import { loadInitialProgress } from '@/lib/progress-server';

/* Non-English course variants (catalan-a1-es/-fr/-ru/-de) duplicate the
   localized marketing landings (/es/curso-de-catalan, …) which carry the
   hreflang cluster and rank for localized keywords. Keep the variant app pages
   out of the index so they don't compete; the English course (catalan-a1) stays
   indexed as the en member of that cluster. Cascades to all course sub-pages. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return mediumForSlug(slug) === 'en' ? {} : { robots: { index: false, follow: true } };
}

export default async function CourseLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getViewableCourse(slug);    // pre-launch courses: owners/admins only
  const medium = mediumForSlug(slug);            // the variant's teaching language
  const access = await getCourseAccess(slug);
  const course = getCourseContent(slug);
  if (!meta || !course) notFound();

  // Sibling language variants of this course.
  const siblings = (courseFamilies().find(f => f.family === meta.family)?.variants ?? [])
    .map(v => ({ medium: v.medium, slug: v.slug }));

  // Admin check, saved progress, audio overrides and owned-sibling lookup don't
  // depend on one another — fan them out instead of awaiting in series.
  const userId = access.user?.id ?? null;
  const [isAdmin, initial, audioOverrides, ownedSet] = await Promise.all([
    userId ? isUserAdmin(userId) : Promise.resolve(false),
    userId ? loadInitialProgress(userId, slug) : Promise.resolve({} as Record<string, unknown>),
    getAudioOverrides(slug),
    userId ? ownedCourseSlugs(userId, siblings.map(s => s.slug)) : Promise.resolve(new Set<string>()),
  ]);
  // The languages of THIS course the learner owns (incl. the current one) — for
  // the in-course language switcher in the sidebar.
  const ownedLanguages = paywallBypassed() ? siblings : siblings.filter(s => ownedSet.has(s.slug));
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
          medium={medium}
          ownedLanguages={ownedLanguages}
        />
        <main className="content">
          {children}
        </main>
      </div>
      <SiteFooter />
      <IpaDrawer html={course.ipaCheatHtml} />
      {access.owns && <GlossaryDrawer rows={getDisplayGlossary(slug)} base={`/courses/${slug}`} />}
      <CharStrip />
    </ProgressProvider>
    </CourseLocaleProvider>
  );
}
