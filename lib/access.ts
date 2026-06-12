import 'server-only';
import type { User } from '@supabase/supabase-js';
import { getServerSupabase, getSessionUser } from './supabase/server';
import { getCourseMeta } from './courses';

export { getSessionUser };

/** QA/local escape hatch — documented in README, never set in production. */
export function paywallBypassed(): boolean {
  return process.env.COURSE_BYPASS_PAYWALL === 'true';
}

export async function userOwnsCourse(userId: string, courseSlug: string): Promise<boolean> {
  const supabase = await getServerSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('course_slug', courseSlug)
    .eq('status', 'paid')
    .limit(1);
  return !!data?.length;
}

export interface CourseAccess {
  user: User | null;
  owns: boolean;
}

export async function getCourseAccess(courseSlug: string): Promise<CourseAccess> {
  const user = await getSessionUser();
  const owns = paywallBypassed() || (user ? await userOwnsCourse(user.id, courseSlug) : false);
  return { user, owns };
}

/** Units in freeUnits are the free preview; everything else needs ownership. */
export function canAccessUnit(courseSlug: string, unitNum: number, access: CourseAccess): boolean {
  if (access.owns) return true;
  const meta = getCourseMeta(courseSlug);
  return !!meta?.freeUnits.includes(unitNum);
}
