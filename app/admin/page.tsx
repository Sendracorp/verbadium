import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import UsersTable from '@/components/admin/UsersTable';
import AdminUserSearch from '@/components/admin/AdminUserSearch';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { COURSES } from '@/lib/courses';
import { LOCALE_LABEL } from '@/lib/i18n';
import { priceIdFor } from '@/lib/paddle';
import { resolveCoursePrice } from '@/lib/pricing';
import { listUsers, getOverviewStats } from '@/lib/admin';

export const metadata: Metadata = { title: 'Admin' };
export const dynamic = 'force-dynamic';

/* Restricted to profiles.is_admin. Cross-user reads use the service-role client. */
export default async function AdminPage({ searchParams }: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
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
        <SiteFooter />
      </>
    );
  }

  const sp = await searchParams;
  const q = (sp.q ?? '').toString();
  const page = Math.max(0, parseInt((sp.page ?? '0').toString(), 10) || 0);
  const [stats, usersPage, pricing] = await Promise.all([
    getOverviewStats(),
    listUsers({ q, page }),
    Promise.all(COURSES.map(async meta => ({
      meta, priceId: priceIdFor(meta.slug), price: await resolveCoursePrice(meta.slug),
    }))),
  ]);

  const { rows, total, pageSize } = usersPage;
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, (page + 1) * pageSize);
  const mkHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (p > 0) params.set('page', String(p));
    return `/admin${params.toString() ? `?${params}` : ''}`;
  };

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <div className="card">
          <h1>Admin</h1>
          <p className="note">
            Grant a course to anyone from their user page below — or{' '}
            <Link href={`/admin/users/${user.id}`}>to yourself</Link>. Manage{' '}
            <Link href="/admin/audio">audio recordings</Link>.
          </p>
          <div className="admin-stats">
            <div><b>{stats.users}</b><span>registered students</span></div>
            <div><b>{stats.paid}</b><span>paid purchases</span></div>
            <div><b>{stats.grants}</b><span>comp grants</span></div>
            <div><b>{stats.resets}</b><span>progress resets</span></div>
            <div><b>{stats.revenue}</b><span>gross revenue (before fees)</span></div>
          </div>
          <p className="note">Finance detail (fees, payouts, taxes) lives in the Paddle dashboard.</p>
        </div>

        <div className="card">
          <h2>Users</h2>
          <AdminUserSearch total={stats.users} />
          <UsersTable users={rows} />
          <div className="admin-pager">
            <span className="muted">{start}–{end} of {total}</span>
            <span className="admin-pager-btns">
              {page > 0
                ? <Link href={mkHref(page - 1)} className="btn">← Prev</Link>
                : <span className="btn admin-pager-disabled">← Prev</span>}
              {end < total
                ? <Link href={mkHref(page + 1)} className="btn">Next →</Link>
                : <span className="btn admin-pager-disabled">Next →</span>}
            </span>
          </div>
        </div>

        <div className="card" data-test="admin-pricing">
          <h2>Pricing</h2>
          <table className="account-table">
            <thead><tr><th>Course</th><th>Price shown</th><th>Source</th><th>Paddle price ID</th></tr></thead>
            <tbody>
              {pricing.map(({ meta, priceId, price }) => (
                <tr key={meta.slug}>
                  <td>{meta.title} — {LOCALE_LABEL[meta.medium]}</td>
                  <td>{price.label || '—'}{price.currency ? ` (${price.currency})` : ''}</td>
                  <td>{price.source === 'paddle'
                    ? <span className="owned-tag">live from Paddle ✓</span>
                    : <span title="Set PADDLE_API_KEY + PADDLE_PRICE_… to pull the live price">catalog fallback</span>}</td>
                  <td><code>{priceId ?? 'not set'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">Prices are managed in Paddle (merchant of record); the amount shown is what customers are charged.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
