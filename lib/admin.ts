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

export interface UsersPage { rows: UserRow[]; total: number; page: number; pageSize: number }

export async function listUsers({ q = '', page = 0, pageSize = 25 }: {
  q?: string; page?: number; pageSize?: number;
} = {}): Promise<UsersPage> {
  const a = getAdminSupabase();
  if (!a) return { rows: [], total: 0, page, pageSize };
  const from = page * pageSize;
  let query = a.from('admin_user_overview').select('*', { count: 'exact' });
  if (q.trim()) query = query.ilike('email', `%${q.trim()}%`);
  const { data, count } = await query
    .order('created_at', { ascending: false }).range(from, from + pageSize - 1);
  return { rows: (data ?? []) as UserRow[], total: count ?? 0, page, pageSize };
}

export interface OverviewStats { users: number; paid: number; grants: number; resets: number; revenue: string }

export async function getOverviewStats(): Promise<OverviewStats> {
  const a = getAdminSupabase();
  if (!a) return { users: 0, paid: 0, grants: 0, resets: 0, revenue: '0' };
  const [users, paid, grants, resets, paidRows] = await Promise.all([
    a.from('profiles').select('id', { count: 'exact', head: true }),
    a.from('purchases').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    a.from('access_grants').select('id', { count: 'exact', head: true }).is('revoked_at', null),
    a.from('progress_resets').select('id', { count: 'exact', head: true }),
    a.from('purchases').select('amount_cents, currency').eq('status', 'paid'),
  ]);
  const byCur = new Map<string, number>();
  for (const p of (paidRows.data ?? []) as { amount_cents: number | null; currency: string | null }[]) {
    const c = (p.currency ?? 'USD').toUpperCase();
    byCur.set(c, (byCur.get(c) ?? 0) + (p.amount_cents ?? 0));
  }
  const revenue = [...byCur.entries()].map(([c, v]) => `${(v / 100).toFixed(2)} ${c}`).join(' + ') || '0';
  return { users: users.count ?? 0, paid: paid.count ?? 0, grants: grants.count ?? 0, resets: resets.count ?? 0, revenue };
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
