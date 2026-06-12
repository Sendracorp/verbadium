import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SignOutButton from '@/components/SignOutButton';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getCourseMeta } from '@/lib/courses';

export const metadata: Metadata = { title: 'Your account' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account');

  const supabase = await getServerSupabase();
  const [{ data: purchases }, { data: profile }] = await Promise.all([
    supabase!.from('purchases')
      .select('course_slug, status, amount_cents, currency, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase!.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
  ]);

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
            <SignOutButton />
            {profile?.is_admin && <Link className="btn" href="/admin">Admin</Link>}
          </div>
        </div>
        <div className="card">
          <h2>Your courses</h2>
          {purchases?.length ? (
            <table className="account-table">
              <thead><tr><th>Course</th><th>Purchased</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {purchases.map(p => {
                  const meta = getCourseMeta(p.course_slug);
                  return (
                    <tr key={p.course_slug + p.created_at}>
                      <td>{meta?.title ?? p.course_slug}</td>
                      <td>{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                      <td>{p.status === 'paid' ? 'Active' : 'Refunded'}</td>
                      <td>{p.status === 'paid' && meta && <Link href={`/courses/${meta.slug}`}>Open →</Link>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>No purchases yet — <Link href="/">browse the courses</Link>.</p>
          )}
        </div>
      </main>
    </>
  );
}
