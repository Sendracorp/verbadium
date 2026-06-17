'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { UserRow } from '@/lib/admin';

export default function UsersTable({ users }: { users: UserRow[] }) {
  const [q, setQ] = useState('');
  const f = q.trim().toLowerCase();
  const rows = f ? users.filter(u => (u.email ?? '').toLowerCase().includes(f)) : users;
  return (
    <div>
      <input
        type="search" className="admin-search" placeholder={`Search ${users.length} users by email…`}
        value={q} onChange={e => setQ(e.target.value)}
      />
      <table className="account-table admin-users">
        <thead>
          <tr>
            <th>User</th><th>Joined</th><th>Access</th><th>Passed</th><th>Mock</th><th>Resets</th><th>Last active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id}>
              <td>
                <Link href={`/admin/users/${u.id}`}>{u.email ?? u.id.slice(0, 8)}</Link>
                {u.is_admin && <span className="admin-tag">admin</span>}
              </td>
              <td>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
              <td>{u.purchases + u.grants > 0
                ? `${u.purchases} bought${u.grants ? ` · ${u.grants} granted` : ''}`
                : <span className="muted">—</span>}</td>
              <td>{u.passed}</td>
              <td>{u.mock_attempts}</td>
              <td>{u.resets ? <strong>{u.resets}</strong> : <span className="muted">0</span>}</td>
              <td>{u.last_active ? new Date(u.last_active).toLocaleDateString('en-GB') : <span className="muted">—</span>}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={7} className="muted">No matching users.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
