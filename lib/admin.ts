import 'server-only';
import { getAdminSupabase } from './supabase/admin';

/* Admin data layer — service-role reads across all users. The /admin pages
   already gate on profiles.is_admin before calling any of this. */

export interface UserRow {
  id: string;
  email: string | null;
  created_at: string;
  is_admin: boolean;
  purchases: number;
  grants: number;
  passed: number;
  mock_attempts: number;
  resets: number;
  last_active: string | null;
}

export async function listUsers(): Promise<UserRow[]> {
  const a = getAdminSupabase();
  if (!a) return [];
  const { data } = await a.from('admin_user_overview').select('*')
    .order('created_at', { ascending: false }).limit(1000);
  return (data ?? []) as UserRow[];
}

export interface CourseProgress { course_slug: string; passed: number; attempted: number; total: number }
export interface UserDetail {
  profile: { id: string; email: string | null; created_at: string; is_admin: boolean; display_name: string | null } | null;
  purchases: { id: string; course_slug: string; status: string; amount_cents: number | null; currency: string | null; created_at: string; provider_order_id: string }[];
  grants: { id: string; course_slug: string; created_at: string; revoked_at: string | null; note: string | null }[];
  progress: CourseProgress[];
  mockAttempts: { id: string; course_slug: string; created_at: string }[];
  resets: { id: string; course_slug: string; created_at: string }[];
}

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const a = getAdminSupabase();
  if (!a) return null;
  const [profile, purchases, grants, progressRows, mockAttempts, resets] = await Promise.all([
    a.from('profiles').select('id,email,created_at,is_admin,display_name').eq('id', id).maybeSingle(),
    a.from('purchases').select('id,course_slug,status,amount_cents,currency,created_at,provider_order_id').eq('user_id', id).order('created_at', { ascending: false }),
    a.from('access_grants').select('id,course_slug,created_at,revoked_at,note').eq('user_id', id).order('created_at', { ascending: false }),
    a.from('exercise_progress').select('course_slug,state').eq('user_id', id),
    a.from('mock_attempts').select('id,course_slug,created_at').eq('user_id', id).order('created_at', { ascending: false }),
    a.from('progress_resets').select('id,course_slug,created_at').eq('user_id', id).order('created_at', { ascending: false }),
  ]);
  if (!profile.data) return null;

  const byCourse = new Map<string, CourseProgress>();
  for (const r of (progressRows.data ?? []) as { course_slug: string; state: string }[]) {
    const c = byCourse.get(r.course_slug) ?? { course_slug: r.course_slug, passed: 0, attempted: 0, total: 0 };
    c.total++;
    if (r.state === 'passed') c.passed++;
    else if (r.state === 'attempted') c.attempted++;
    byCourse.set(r.course_slug, c);
  }
  return {
    profile: profile.data as UserDetail['profile'],
    purchases: (purchases.data ?? []) as UserDetail['purchases'],
    grants: (grants.data ?? []) as UserDetail['grants'],
    progress: [...byCourse.values()],
    mockAttempts: (mockAttempts.data ?? []) as UserDetail['mockAttempts'],
    resets: (resets.data ?? []) as UserDetail['resets'],
  };
}
