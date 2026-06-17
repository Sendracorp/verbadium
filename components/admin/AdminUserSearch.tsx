'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/* Debounced email search that drives ?q= (resets to page 1). */
export default function AdminUserSearch({ total }: { total: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');

  useEffect(() => {
    const current = sp.get('q') ?? '';
    if (q === current) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      router.replace(`/admin${params.toString() ? `?${params}` : ''}`);
    }, 300);
    return () => clearTimeout(t);
  }, [q, router, sp]);

  return (
    <input
      className="admin-search" type="search"
      placeholder={`Search ${total} users by email…`}
      value={q} onChange={e => setQ(e.target.value)}
    />
  );
}
