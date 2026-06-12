import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getCourseMeta } from '@/lib/courses';

export const metadata: Metadata = { title: 'Admin' };
export const dynamic = 'force-dynamic';

/* Restricted to profiles.is_admin (set it once in the Supabase SQL editor:
   `update profiles set is_admin = true where email = '...';`).
   Cross-user reads use the service-role client, server-side only. */
export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');

  const supabase = await getServerSupabase();
  const { data: profile } = await supabase!
    .from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) notFound();

  const admin = getAdminSupabase();
  if (!admin) {
    return (
      <>
        <SiteHeader />
        <main className="site-main"><div className="card"><h2>Admin</h2>
          <p>SUPABASE_SERVICE_ROLE_KEY is not configured on this deployment.</p>
        </div></main>
      </>
    );
  }

  const [{ count: userCount }, { data: purchases }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('purchases')
      .select('course_slug, status, amount_cents, currency, created_at, profiles:user_id (email)')
      .order('created_at', { ascending: false }).limit(200),
  ]);

  const paid = (purchases ?? []).filter(p => p.status === 'paid');
  const revenueByCurrency = new Map<string, number>();
  for (const p of paid) {
    const cur = (p.currency ?? 'USD').toUpperCase();
    revenueByCurrency.set(cur, (revenueByCurrency.get(cur) ?? 0) + (p.amount_cents ?? 0));
  }
  const revenue = [...revenueByCurrency.entries()]
    .map(([cur, cents]) => `${(cents / 100).toFixed(2)} ${cur}`).join(' + ') || '0';

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <div className="card">
          <h2>Admin overview</h2>
          <div className="admin-stats">
            <div><b>{userCount ?? 0}</b><span>registered students</span></div>
            <div><b>{paid.length}</b><span>active purchases</span></div>
            <div><b>{revenue}</b><span>gross revenue (before Lemon Squeezy fees)</span></div>
          </div>
          <p className="note">Finance detail (fees, payouts, taxes) lives in the Lemon Squeezy dashboard.</p>
        </div>
        <div className="card">
          <h2>Purchases</h2>
          {purchases?.length ? (
            <table className="account-table">
              <thead><tr><th>Date</th><th>Student</th><th>Course</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {purchases.map((p, i) => (
                  <tr key={i}>
                    <td>{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                    <td>{(p.profiles as unknown as { email: string } | null)?.email ?? '—'}</td>
                    <td>{getCourseMeta(p.course_slug)?.title ?? p.course_slug}</td>
                    <td>{p.amount_cents != null ? `${(p.amount_cents / 100).toFixed(2)} ${p.currency ?? ''}` : '—'}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No purchases yet.</p>}
        </div>
      </main>
    </>
  );
}
