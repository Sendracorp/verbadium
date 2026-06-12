'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { exState, MockAttempt, resetAll, sget, subscribe } from '@/lib/progress';

export interface DashUnit { num: number; title: string; exerciseIds: string[] }

function fmtPart(v: number | null, total: number): string {
  return v === null ? '—' : `${v}/${total}`;
}

export default function Dashboard({ units, base }: { units: DashUnit[]; base: string }) {
  const [, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    return subscribe(() => setTick(t => t + 1));
  }, []);

  const progress = (u: DashUnit) => {
    if (!hydrated) return { passed: 0, attempted: 0, total: u.exerciseIds.length };
    let passed = 0, attempted = 0;
    for (const id of u.exerciseIds) {
      const st = exState(id).state;
      if (st === 'passed') passed++;
      else if (st === 'attempted') attempted++;
    }
    return { passed, attempted, total: u.exerciseIds.length };
  };
  const totals = units.reduce(
    (a, u) => {
      const p = progress(u);
      return { passed: a.passed + p.passed, attempted: a.attempted + p.attempted, total: a.total + p.total };
    },
    { passed: 0, attempted: 0, total: 0 });
  const attempts = hydrated ? sget<MockAttempt[]>('mock.attempts', []) : [];

  // "Continue where you left off": the unit of the most recently touched
  // exercise; before any activity, the first incomplete unit.
  let continueUnit = units[0]?.num ?? 1;
  let latestTs = 0;
  if (hydrated) {
    for (const u of units) {
      for (const id of u.exerciseIds) {
        const st = exState(id);
        if (st.ts && st.ts > latestTs) { latestTs = st.ts; continueUnit = u.num; }
      }
    }
    if (!latestTs) continueUnit = units.find(u => progress(u).passed < u.exerciseIds.length)?.num ?? continueUnit;
  }
  const nextUnit = units.find(u => progress(u).passed < u.exerciseIds.length);
  const allDone = hydrated && !nextUnit;

  return (
    <div className="card dash">
      <h2>Your progress</h2>
      <div className="dash-overall">
        <div className="progress-bar big">
          <div className="progress-fill" id="overallBar" style={{ width: `${totals.total ? Math.round(totals.passed / totals.total * 100) : 0}%` }} />
        </div>
        <div id="overallStats" className="dash-stats">
          {totals.passed} of {totals.total} exercises passed
          {totals.attempted ? ` · ${totals.attempted} in progress` : ''}
        </div>
      </div>
      <div className="dash-next">
        <Link className="btn btn-primary" href={`${base}/unit/${continueUnit}`} data-test="continue-btn">
          {latestTs ? `Continue · Unit ${continueUnit}` : 'Start the course · Unit 1'}
        </Link>
        {hydrated && (
          <span className="dash-next-hint" data-test="whats-next">
            {allDone
              ? <>All units complete — time for the <Link href={`${base}/mock`}>mock exam</Link>!</>
              : nextUnit && nextUnit.num !== continueUnit
                ? <>Up next: Unit {nextUnit.num} has unfinished exercises.</>
                : null}
          </span>
        )}
      </div>
      <div className="unit-grid">
        {units.map(u => {
          const p = progress(u);
          return (
            <Link className="unit-card" href={`${base}/unit/${u.num}`} key={u.num}>
              <div className="unit-card-num">Unit {u.num}</div>
              <div className="unit-card-title" dangerouslySetInnerHTML={{ __html: u.title }} />
              <div className="progress-bar">
                <div className="progress-fill" data-unitbar={u.num} style={{ width: `${Math.round(p.passed / p.total * 100)}%` }} />
              </div>
              <div className="unit-card-stats" data-unitstats={u.num}>
                {p.passed}/{p.total} exercises{p.passed === p.total ? ' ✓' : ''}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="dash-extra">
        <span id="mockStats">
          {attempts.length
            ? `Mock exam attempts: ${attempts.length} (last: ${attempts[attempts.length - 1].date})`
            : 'Mock exam not attempted yet.'}
        </span>
        <button
          type="button" id="resetProgress" className="btn btn-danger"
          onClick={() => {
            if (confirm('Reset ALL progress? This clears exercise results, the checklist and mock-exam history.')) {
              resetAll();
            }
          }}
        >Reset all progress</button>
      </div>
      {attempts.length > 0 && (
        <div className="mock-history" data-test="mock-history">
          <h3>Mock exam history</h3>
          <table className="mock-history-table">
            <thead>
              <tr><th>Date</th><th>Listening</th><th>Reading A</th><th>Reading B</th><th>Writing</th><th>Speaking</th></tr>
            </thead>
            <tbody>
              {attempts.slice().reverse().map((a, i) => (
                <tr key={i}>
                  <td>{a.date}</td>
                  <td>{fmtPart(a.p1, 6)}</td>
                  <td>{fmtPart(a.p2a, 4)}</td>
                  <td>{fmtPart(a.p2b, 5)}</td>
                  <td>{a.p3 === null ? '—' : a.p3 ? '✓' : '✗'}</td>
                  <td>{a.p4 === null ? '—' : a.p4 ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
