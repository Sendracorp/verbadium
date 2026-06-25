import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getSessionUser, isUserAdmin } from '@/lib/access';
import { getCourseAnalytics } from '@/lib/admin';

export const metadata: Metadata = { title: 'Learning analytics · Admin' };
export const dynamic = 'force-dynamic';

const FAMILY = 'catalan-a1';

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin/analytics');
  if (!(await isUserAdmin(user.id))) notFound();

  const a = await getCourseAnalytics(FAMILY);

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <p className="admin-back"><Link href="/admin">← Admin</Link></p>
        <div className="card">
          <h1>Learning analytics</h1>
          <p className="note">
            First-party, aggregated from your own progress data across all language variants of{' '}
            <code>{FAMILY}</code>. No cookies, no third party.
          </p>
          {!a ? (
            <p className="note">Service-role key not configured — analytics unavailable.</p>
          ) : (
            <div className="admin-stats">
              <div><b>{a.learners}</b><span>learners with progress</span></div>
              <div><b>{a.totalPassed}</b><span>exercises passed</span></div>
              <div><b>{a.totalAttempted}</b><span>attempts not yet passed</span></div>
              <div><b>{a.exercisesTouched}</b><span>distinct exercises touched</span></div>
              <div><b>{a.mock.attempts}</b><span>mock-exam attempts</span></div>
            </div>
          )}
        </div>

        {a && (
          <>
            <div className="card">
              <h2>Where learners get stuck</h2>
              <p className="note">Exercises with the most learners attempting but not passing — likely too hard or unclear.</p>
              {a.hardest.length ? (
                <table className="account-table">
                  <thead><tr><th>Exercise</th><th>Unit</th><th>Stuck (attempted)</th><th>Passed</th></tr></thead>
                  <tbody>
                    {a.hardest.map(e => (
                      <tr key={e.id}>
                        <td><code>{e.id}</code></td>
                        <td>{e.unit ?? '—'}</td>
                        <td>{e.attempted}</td>
                        <td>{e.passed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="note">No attempt data yet.</p>}
            </div>

            <div className="card">
              <h2>Per-unit completion</h2>
              <p className="note">Passed vs total exercises per unit — a falling trend shows where learners drop off.</p>
              <table className="account-table">
                <thead><tr><th>Unit</th><th>Passed</th><th>In progress</th><th>Total</th><th>Completion</th></tr></thead>
                <tbody>
                  {a.units.map(u => (
                    <tr key={u.unit}>
                      <td>{u.unit}</td>
                      <td>{u.passed}</td>
                      <td>{u.attempted}</td>
                      <td>{u.total}</td>
                      <td>{a.learners ? Math.round((u.passed / (u.total * a.learners)) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="note">Completion = passes ÷ (exercises × learners), so 100% means every learner passed every exercise in the unit.</p>
            </div>

            <div className="card">
              <h2>Mock exam</h2>
              {a.mock.attempts ? (
                <div className="admin-stats">
                  <div><b>{a.mock.attempts}</b><span>attempts ({a.mock.learners} learners)</span></div>
                  <div><b>{a.mock.avg.p1 ?? '—'}/6</b><span>avg listening</span></div>
                  <div><b>{a.mock.avg.p2a ?? '—'}/4</b><span>avg reading A</span></div>
                  <div><b>{a.mock.avg.p2b ?? '—'}/5</b><span>avg reading B</span></div>
                  <div><b>{a.mock.writingPass}</b><span>self-marked writing pass</span></div>
                  <div><b>{a.mock.speakingPass}</b><span>self-marked speaking pass</span></div>
                </div>
              ) : <p className="note">No mock attempts yet.</p>}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
