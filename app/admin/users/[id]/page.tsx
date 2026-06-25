import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ConfirmSubmit from '@/components/admin/ConfirmSubmit';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getCourseMeta, COURSES } from '@/lib/courses';
import { LOCALE_LABEL } from '@/lib/i18n';
import { getUserDetail } from '@/lib/admin';
import { grantAccess, revokeGrant, setPurchaseStatus, toggleAdmin, resetUserProgress } from '@/app/admin/actions';

export const metadata: Metadata = { title: 'User · Admin' };
export const dynamic = 'force-dynamic';

const courseName = (slug: string) => getCourseMeta(slug)?.title ?? slug;
const date = (s: string) => new Date(s).toLocaleString('en-GB');

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) redirect(`/login?next=/admin/users/${id}`);
  const supabase = await getServerSupabase();
  const { data: meProfile } = await supabase!.from('profiles').select('is_admin').eq('id', me.id).maybeSingle();
  if (!meProfile?.is_admin) notFound();

  const d = await getUserDetail(id);
  if (!d || !d.profile) notFound();
  const p = d.profile;
  const isSelf = p.id === me.id;

  // Courses this user can still be given (no paid purchase, no active grant).
  const ownedSlugs = new Set<string>([
    ...d.purchases.filter(pu => pu.status === 'paid').map(pu => pu.course_slug),
    ...d.grants.filter(g => !g.revoked_at).map(g => g.course_slug),
  ]);
  const grantable = COURSES.filter(c => !ownedSlugs.has(c.slug));

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <p className="admin-back"><Link href="/admin">← All users</Link></p>

        <div className="card">
          <h1>{p.email ?? p.id}{isSelf && <span className="admin-tag">you</span>}</h1>
          <p className="note">
            Joined {date(p.created_at)} · ID <code>{p.id}</code>
            {p.is_admin && <span className="admin-tag">admin</span>}
          </p>
          <form action={toggleAdmin} className="admin-inline-form">
            <input type="hidden" name="userId" value={p.id} />
            <input type="hidden" name="makeAdmin" value={(!p.is_admin).toString()} />
            <ConfirmSubmit className="btn" confirm={`${p.is_admin ? 'Remove admin from' : 'Make admin'} ${p.email}?`}>
              {p.is_admin ? 'Revoke admin' : 'Make admin'}
            </ConfirmSubmit>
          </form>
        </div>

        {/* Access: grant + current grants + purchases */}
        <div className="card">
          <h2>Course access</h2>
          <h3>Add a course{isSelf ? ' to yourself' : ''}</h3>
          {grantable.length ? (
            <>
              <form action={grantAccess} className="admin-grant-form">
                <input type="hidden" name="userId" value={p.id} />
                <select name="courseSlug" required defaultValue="">
                  <option value="" disabled>Choose a course…</option>
                  {grantable.map(c => <option key={c.slug} value={c.slug}>{c.title} — {LOCALE_LABEL[c.medium]}</option>)}
                </select>
                <input type="text" name="note" placeholder="note (optional)" />
                <button type="submit" className="btn btn-primary">Grant access</button>
              </form>
              <p className="note">Grants free access (no payment). Revoke any time below.</p>
            </>
          ) : <p className="muted">This user already has access to every course.</p>}

          <h3>Comp grants</h3>
          {d.grants.length ? (
            <table className="account-table">
              <thead><tr><th>Course</th><th>Granted</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {d.grants.map(g => (
                  <tr key={g.id}>
                    <td>{courseName(g.course_slug)}{g.note ? ` — ${g.note}` : ''}</td>
                    <td>{date(g.created_at)}</td>
                    <td>{g.revoked_at ? <span className="muted">revoked {date(g.revoked_at)}</span> : <span className="owned-tag">active</span>}</td>
                    <td>{!g.revoked_at && (
                      <form action={revokeGrant}>
                        <input type="hidden" name="grantId" value={g.id} />
                        <input type="hidden" name="userId" value={p.id} />
                        <ConfirmSubmit className="btn btn-danger" confirm={`Revoke ${courseName(g.course_slug)} access?`}>Revoke</ConfirmSubmit>
                      </form>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="muted">No comp grants.</p>}

          <h3>Purchases (Paddle)</h3>
          {d.purchases.length ? (
            <table className="account-table">
              <thead><tr><th>Course</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {d.purchases.map(pu => (
                  <tr key={pu.id}>
                    <td>{courseName(pu.course_slug)}</td>
                    <td>{date(pu.created_at)}</td>
                    <td>{pu.amount_cents != null ? `${(pu.amount_cents / 100).toFixed(2)} ${pu.currency ?? ''}` : '—'}</td>
                    <td>{pu.status}</td>
                    <td>
                      <form action={setPurchaseStatus}>
                        <input type="hidden" name="purchaseId" value={pu.id} />
                        <input type="hidden" name="userId" value={p.id} />
                        <input type="hidden" name="status" value={pu.status === 'paid' ? 'refunded' : 'paid'} />
                        <ConfirmSubmit className="btn" confirm={`Set this purchase to ${pu.status === 'paid' ? 'refunded (revoke access)' : 'paid (restore access)'}? This does NOT move money.`}>
                          {pu.status === 'paid' ? 'Revoke access' : 'Restore access'}
                        </ConfirmSubmit>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="muted">No purchases.</p>}
        </div>

        {/* Progress per course */}
        <div className="card">
          <h2>Progress</h2>
          {d.progress.length ? (
            <table className="account-table">
              <thead><tr><th>Course</th><th>Passed</th><th>In progress</th><th>Touched</th><th></th></tr></thead>
              <tbody>
                {d.progress.map(c => (
                  <tr key={c.course_slug}>
                    <td>{courseName(c.course_slug)}</td>
                    <td>{c.passed}</td>
                    <td>{c.attempted}</td>
                    <td>{c.total}</td>
                    <td>
                      <form action={resetUserProgress}>
                        <input type="hidden" name="userId" value={p.id} />
                        <input type="hidden" name="courseSlug" value={c.course_slug} />
                        <ConfirmSubmit className="btn btn-danger" confirm={`Reset ALL progress for ${courseName(c.course_slug)}? This deletes their exercises, mock attempts and checklist.`}>Reset</ConfirmSubmit>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="muted">No progress yet.</p>}
        </div>

        {/* History */}
        <div className="card">
          <h2>Mock-exam attempts ({d.mockAttempts.length})</h2>
          {d.mockAttempts.length ? (
            <ul className="admin-list">
              {d.mockAttempts.slice(0, 20).map(m => <li key={m.id}>{courseName(m.course_slug)} · {date(m.created_at)}</li>)}
            </ul>
          ) : <p className="muted">None.</p>}

          <h2>Progress resets ({d.resets.length})</h2>
          {d.resets.length ? (
            <ul className="admin-list">
              {d.resets.slice(0, 20).map(r => <li key={r.id}>{courseName(r.course_slug)} · {date(r.created_at)}</li>)}
            </ul>
          ) : <p className="muted">None.</p>}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
