import Link from 'next/link';
import type { UserRow } from '@/lib/admin';

/* Presentational users table (search + pagination handled by the page/URL). */
export default function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <table className="account-table admin-users">
      <thead>
        <tr>
          <th>User</th><th>Joined</th><th>Access</th><th>Passed</th><th>Mock</th><th>Resets</th><th>Last active</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
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
        {users.length === 0 && <tr><td colSpan={7} className="muted">No matching users.</td></tr>}
      </tbody>
    </table>
  );
}
