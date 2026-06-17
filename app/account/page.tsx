import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getCourseMeta } from '@/lib/courses';

export const metadata: Metadata = { title: 'Your account' };
export const dynamic = 'force-dynamic';

type AccessRow = { slug: string; status: 'Active' | 'Granted' | 'Refunded'; date: string; open: boolean };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account');

  const supabase = await getServerSupabase();
  const [{ data: purchases }, { data: grants }] = await Promise.all([
    supabase!.from('purchases')
      .select('course_slug, status, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase!.from('access_grants')
      .select('course_slug, created_at')
      .eq('user_id', user.id).is('revoked_at', null).order('created_at', { ascending: false }),
  ]);

  // One row per course; access = paid purchase OR active grant. A live grant
  // beats a refunded purchase (it still gives access).
  const byCourse = new Map<string, AccessRow>();
  for (const p of purchases ?? []) {
    if (p.status === 'paid') {
      byCourse.set(p.course_slug, { slug: p.course_slug, status: 'Active', date: p.created_at, open: true });
    } else if (!byCourse.has(p.course_slug)) {
      byCourse.set(p.course_slug, { slug: p.course_slug, status: 'Refunded', date: p.created_at, open: false });
    }
  }
  for (const g of grants ?? []) {
    const cur = byCourse.get(g.course_slug);
    if (!cur || cur.status === 'Refunded') {
      byCourse.set(g.course_slug, { slug: g.course_slug, status: 'Granted', date: g.created_at, open: true });
    }
  }
  const rows = [...byCourse.values()].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <div className="card">
          <h2>Your account</h2>
          <p><b>Email:</b> {user.email}</p>
          <p><b>Member since:</b> {new Date(user.created_at).toLocaleDateString('en-GB')}</p>
          <div className="paywall-actions">
            <Link className="btn" href="/forgot-password">Change password</Link>
          </div>
        </div>
        <div className="card">
          <h2>Your courses</h2>
          {rows.length ? (
            <table className="account-table">
              <thead><tr><th>Course</th><th>Since</th><th>Access</th><th></th></tr></thead>
              <tbody>
                {rows.map(r => {
                  const meta = getCourseMeta(r.slug);
                  return (
                    <tr key={r.slug}>
                      <td>{meta?.title ?? r.slug}</td>
                      <td>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                      <td>{r.status === 'Granted' ? 'Granted (free access)' : r.status}</td>
                      <td>{r.open && meta && <Link href={`/courses/${meta.slug}`}>Open →</Link>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>No courses yet — <Link href="/">browse the courses</Link>.</p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
