import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import UsersTable from '@/components/admin/UsersTable';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { COURSES } from '@/lib/courses';
import { priceIdFor } from '@/lib/paddle';
import { resolveCoursePrice } from '@/lib/pricing';
import { listUsers } from '@/lib/admin';

export const metadata: Metadata = { title: 'Admin' };
export const dynamic = 'force-dynamic';

/* Restricted to profiles.is_admin. Cross-user reads use the service-role client. */
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
        <SiteFooter />
      </>
    );
  }

  const users = await listUsers();
  const paidCount = users.reduce((n, u) => n + u.purchases, 0);
  const grantCount = users.reduce((n, u) => n + u.grants, 0);
  const resetCount = users.reduce((n, u) => n + u.resets, 0);

  // gross revenue from purchase amounts
  const { data: paid } = await admin.from('purchases')
    .select('amount_cents, currency').eq('status', 'paid');
  const byCur = new Map<string, number>();
  for (const p of paid ?? []) {
    const cur = (p.currency ?? 'USD').toUpperCase();
    byCur.set(cur, (byCur.get(cur) ?? 0) + (p.amount_cents ?? 0));
  }
  const revenue = [...byCur.entries()].map(([c, v]) => `${(v / 100).toFixed(2)} ${c}`).join(' + ') || '0';

  const pricing = await Promise.all(COURSES.map(async meta => ({
    meta, priceId: priceIdFor(meta.slug), price: await resolveCoursePrice(meta.slug),
  })));

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <div className="card">
          <h1>Admin</h1>
          <div className="admin-stats">
            <div><b>{users.length}</b><span>registered students</span></div>
            <div><b>{paidCount}</b><span>paid purchases</span></div>
            <div><b>{grantCount}</b><span>comp grants</span></div>
            <div><b>{resetCount}</b><span>progress resets</span></div>
            <div><b>{revenue}</b><span>gross revenue (before fees)</span></div>
          </div>
          <p className="note">Finance detail (fees, payouts, taxes) lives in the Paddle dashboard.</p>
        </div>

        <div className="card">
          <h2>Users</h2>
          <UsersTable users={users} />
        </div>

        <div className="card" data-test="admin-pricing">
          <h2>Pricing</h2>
          <table className="account-table">
            <thead><tr><th>Course</th><th>Price shown</th><th>Source</th><th>Paddle price ID</th></tr></thead>
            <tbody>
              {pricing.map(({ meta, priceId, price }) => (
                <tr key={meta.slug}>
                  <td>{meta.title}</td>
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
