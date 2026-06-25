import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getCourseMeta } from '@/lib/courses';
import { getDict } from '@/lib/i18n';
import { preferredMedium } from '@/lib/medium';

export const metadata: Metadata = { title: 'Your account' };
export const dynamic = 'force-dynamic';

type AccessRow = { slug: string; status: 'Active' | 'Granted' | 'Refunded'; date: string; open: boolean };

export default async function AccountPage() {
  const [user, lang] = await Promise.all([getSessionUser(), preferredMedium()]);
  if (!user) redirect('/login?next=/account');
  const l = lang ?? 'en';
  const dict = getDict(l);
  const d = dict.account;
  const fmtDate = (s: string) => new Date(s).toLocaleDateString(l === 'en' ? 'en-GB' : l);

  const supabase = await getServerSupabase();
  const [{ data: purchases }, { data: grants }, { data: profile }] = await Promise.all([
    supabase!.from('purchases')
      .select('course_slug, status, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase!.from('access_grants')
      .select('course_slug, created_at')
      .eq('user_id', user.id).is('revoked_at', null).order('created_at', { ascending: false }),
    // "Member since" — the JWT carries no account-creation date, so read it from
    // the profile row (created at signup).
    supabase!.from('profiles').select('created_at').eq('id', user.id).maybeSingle(),
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
  const statusLabel = (s: AccessRow['status']) =>
    s === 'Active' ? d.statusActive : s === 'Granted' ? d.statusGranted : d.statusRefunded;

  return (
    <>
      <SiteHeader lang={l} />
      <main className="site-main">
        <div className="card">
          <h2>{d.title}</h2>
          <p><b>{d.email}:</b> {user.email}</p>
          {profile?.created_at && (
            <p><b>{d.memberSince}:</b> {fmtDate(profile.created_at)}</p>
          )}
          <div className="paywall-actions">
            <Link className="btn" href="/forgot-password">{d.changePassword}</Link>
          </div>
        </div>
        <div className="card">
          <h2>{d.yourCourses}</h2>
          {rows.length ? (
            <table className="account-table">
              <thead><tr><th>{d.colCourse}</th><th>{d.colSince}</th><th>{d.colAccess}</th><th></th></tr></thead>
              <tbody>
                {rows.map(r => {
                  const meta = getCourseMeta(r.slug);
                  return (
                    <tr key={r.slug}>
                      <td>{meta ? dict.course.name : r.slug}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{statusLabel(r.status)}</td>
                      <td>{r.open && meta && <Link href={`/courses/${meta.slug}`}>{d.open} →</Link>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>{d.noCoursesPre}<Link href="/">{d.browse}</Link>.</p>
          )}
        </div>
      </main>
      <SiteFooter lang={l} />
    </>
  );
}
