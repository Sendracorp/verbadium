import 'server-only';
import { cache } from 'react';
import { getServerSupabase, getSessionUser, type SessionUser } from './supabase/server';
import { courseVariant, type CourseMeta } from './courses';

export { getSessionUser };

/** QA/local escape hatch — documented in README, never set in production. */
export function paywallBypassed(): boolean {
  return process.env.COURSE_BYPASS_PAYWALL === 'true';
}

/** Access = a paid Paddle purchase OR an active admin grant. */
export async function userOwnsCourse(userId: string, courseSlug: string): Promise<boolean> {
  const supabase = await getServerSupabase();
  if (!supabase) return false;
  const [paid, granted] = await Promise.all([
    supabase.from('purchases').select('id')
      .eq('user_id', userId).eq('course_slug', courseSlug).eq('status', 'paid').limit(1),
    supabase.from('access_grants').select('id')
      .eq('user_id', userId).eq('course_slug', courseSlug).is('revoked_at', null).limit(1),
  ]);
  return !!(paid.data?.length || granted.data?.length);
}

/** Which of the given course slugs the user owns (paid OR active grant) — one
    batched query pair, for showing the languages of a course a learner owns. */
export async function ownedCourseSlugs(userId: string, slugs: string[]): Promise<Set<string>> {
  const supabase = await getServerSupabase();
  if (!supabase || slugs.length === 0) return new Set();
  const [paid, granted] = await Promise.all([
    supabase.from('purchases').select('course_slug')
      .eq('user_id', userId).eq('status', 'paid').in('course_slug', slugs),
    supabase.from('access_grants').select('course_slug')
      .eq('user_id', userId).is('revoked_at', null).in('course_slug', slugs),
  ]);
  const set = new Set<string>();
  for (const r of (paid.data ?? []) as { course_slug: string }[]) set.add(r.course_slug);
  for (const r of (granted.data ?? []) as { course_slug: string }[]) set.add(r.course_slug);
  return set;
}

export interface CourseAccess {
  user: SessionUser | null;
  owns: boolean;
}

export const getCourseAccess = cache(async (courseSlug: string): Promise<CourseAccess> => {
  const user = await getSessionUser();
  const owns = paywallBypassed() || (user ? await userOwnsCourse(user.id, courseSlug) : false);
  return { user, owns };
});

/** Whether the user is an admin. Cached per request; reads its own profile row
    via the cookie-bound client (RLS: a user can read their own profile). */
export const isUserAdmin = cache(async (userId: string): Promise<boolean> => {
  const supabase = await getServerSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from('profiles').select('is_admin').eq('id', userId).maybeSingle();
  return !!data?.is_admin;
});

/** Course meta for a viewer, gating pre-launch courses. An `available` course
    is public. An unavailable (not-yet-launched) course is viewable only by
    someone who already has access to it (comp grant or purchase) or an admin —
    so an admin can grant themselves a course and preview it before launch;
    everyone else gets undefined (→ 404). Returns the same meta as
    getCourseMeta, just without the availability filter for eligible viewers. */
export const getViewableCourse = cache(async (slug: string): Promise<CourseMeta | undefined> => {
  const meta = courseVariant(slug);
  if (!meta) return undefined;
  if (meta.available) return meta;
  const access = await getCourseAccess(slug);          // cached per request
  if (access.owns) return meta;
  if (access.user && await isUserAdmin(access.user.id)) return meta;
  return undefined;
});

/** Units in freeUnits are the free preview; everything else needs ownership. */
export function canAccessUnit(courseSlug: string, unitNum: number, access: CourseAccess): boolean {
  if (access.owns) return true;
  // courseVariant (not getCourseMeta) so a pre-launch course's free preview
  // still works for admins/previewers; the page itself is gated upstream.
  const meta = courseVariant(courseSlug);
  return !!meta?.freeUnits.includes(unitNum);
}
