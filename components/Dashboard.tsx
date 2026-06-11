'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { exState, MockAttempt, resetAll, sget, subscribe } from '@/lib/progress';

export interface DashUnit { num: number; title: string; exerciseIds: string[] }

export default function Dashboard({ units }: { units: DashUnit[] }) {
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
      <div className="unit-grid">
        {units.map(u => {
          const p = progress(u);
          return (
            <Link className="unit-card" href={`/unit/${u.num}`} key={u.num}>
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
            if (confirm('Reset ALL progress? This clears exercise results, the checklist and mock-exam history on this device.')) {
              resetAll();
            }
          }}
        >Reset all progress</button>
      </div>
    </div>
  );
}
