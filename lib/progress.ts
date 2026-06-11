/* localStorage progress, namespaced catalanA1.* — client-only.
   A tiny pub/sub lets nav badges and the dashboard re-render on change. */

const NS = 'catalanA1.';

export type ExProgressState = 'untouched' | 'attempted' | 'passed';
export interface ExProgress { state: ExProgressState; score: number; total: number; ts?: number }

export interface MockAttempt {
  date: string;
  p1: number | null;
  p2a: number | null;
  p2b: number | null;
  p3: boolean | null;
  p3words: number;
  p4: boolean | null;
  p4aloud: number;
  overtime: Record<string, boolean>;
}

export function sget<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(NS + key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch { return fallback; }
}
export function sset(key: string, val: unknown): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(NS + key, JSON.stringify(val)); } catch { /* quota */ }
  notify();
}

export function exState(id: string): ExProgress {
  return sget<ExProgress>('ex.' + id, { state: 'untouched', score: 0, total: 0 });
}
export function setExState(id: string, state: ExProgressState, score = 0, total = 0): void {
  sset('ex.' + id, { state, score, total, ts: Date.now() });
}

export function resetAll(): void {
  if (typeof window === 'undefined') return;
  const kill: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(NS)) kill.push(k);
  }
  kill.forEach(k => localStorage.removeItem(k));
  notify();
}

type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify(): void { listeners.forEach(fn => fn()); }
