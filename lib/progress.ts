/* Progress store. Same API the exercise engine has always used
   (sget/sset/exState/setExState/subscribe), now backed by:
   — logged in:  in-memory cache seeded from Supabase by <ProgressProvider>,
                 optimistic writes pushed through a retrying queue;
   — logged out: localStorage, namespaced per course (free-preview progress
                 survives on-device; there is nothing to migrate server-side).
   A tiny pub/sub lets nav badges and the dashboard re-render on change. */

import { getBrowserSupabase } from './supabase/client';

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

/* Keys that are device preferences, not learning progress — always local. */
const DEVICE_KEYS = new Set(['mock.conditions', 'ttsNoticeDismissed']);

interface Backend { userId: string; courseSlug: string }

let courseSlug = 'catalan-a1';
let backend: Backend | null = null;
const cache = new Map<string, unknown>();

const NS = () => `cfs.${courseSlug}.`;

/** Called once by <ProgressProvider> before any course UI mounts. */
export function configureProgress(opts: {
  userId: string | null;
  courseSlug: string;
  initial: Record<string, unknown>;
}): void {
  if (typeof window === 'undefined') return;     // module state is per-request on the server; never seed there
  courseSlug = opts.courseSlug;
  backend = opts.userId ? { userId: opts.userId, courseSlug: opts.courseSlug } : null;
  cache.clear();
  for (const [k, v] of Object.entries(opts.initial)) cache.set(k, v);
  notify();
}

export function sget<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  if (backend && !DEVICE_KEYS.has(key)) {
    return cache.has(key) ? (cache.get(key) as T) : fallback;
  }
  try {
    const v = localStorage.getItem(NS() + key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch { return fallback; }
}

export function sset(key: string, val: unknown): void {
  if (typeof window === 'undefined') return;
  if (backend && !DEVICE_KEYS.has(key)) {
    cache.set(key, val);
    enqueuePush(key, val);
  } else {
    try { localStorage.setItem(NS() + key, JSON.stringify(val)); } catch { /* quota */ }
  }
  notify();
}

export function exState(id: string): ExProgress {
  return sget<ExProgress>('ex.' + id, { state: 'untouched', score: 0, total: 0 });
}
export function setExState(id: string, state: ExProgressState, score = 0, total = 0): void {
  sset('ex.' + id, { state, score, total, ts: Date.now() });
}

/** Append a finished mock-exam attempt (one immutable row server-side). */
export function addMockAttempt(a: MockAttempt): void {
  const next = [...sget<MockAttempt[]>('mock.attempts', []), a];
  if (backend) {
    cache.set('mock.attempts', next);
    pending.push({ kind: 'mock-insert', attempt: a });
    scheduleFlush(0);
    notify();
  } else {
    sset('mock.attempts', next);
  }
}

export function resetAll(): void {
  if (typeof window === 'undefined') return;
  if (backend) {
    cache.clear();
    pending.push({ kind: 'reset' });
    scheduleFlush(0);
  } else {
    const kill: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS())) kill.push(k);
    }
    kill.forEach(k => localStorage.removeItem(k));
  }
  notify();
}

// ───────────────────────── push queue (remote mode) ─────────────────────────
/* Optimistic UI: the cache is already updated; pushes retry with backoff and
   latest-write-wins per key, so a flaky connection never blocks an exercise. */

type Op =
  | { kind: 'upsert'; key: string; val: unknown }
  | { kind: 'mock-insert'; attempt: MockAttempt }
  | { kind: 'reset' };

const pending: Op[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let backoffMs = 1000;
let flushing = false;

function enqueuePush(key: string, val: unknown): void {
  const i = pending.findIndex(op => op.kind === 'upsert' && op.key === key);
  if (i >= 0) (pending[i] as Op & { kind: 'upsert' }).val = val;
  else pending.push({ kind: 'upsert', key, val });
  scheduleFlush(0);
}

function scheduleFlush(delay: number): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => { flushTimer = null; void flush(); }, delay);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => scheduleFlush(0));
}

async function flush(): Promise<void> {
  if (flushing || !backend || pending.length === 0) return;
  const supabase = getBrowserSupabase();
  if (!supabase) return;
  flushing = true;
  const { userId, courseSlug: slug } = backend;
  try {
    while (pending.length > 0) {
      const op = pending[0];
      if (op.kind === 'upsert') {
        const m = op.key.match(/^ex\.(.+)$/);
        if (m) {
          const p = op.val as ExProgress;
          const { error } = await supabase.from('exercise_progress').upsert({
            user_id: userId, course_slug: slug, exercise_id: m[1],
            state: p.state, score: p.score, total: p.total,
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        } else if (op.key === 'checklist') {
          const { error } = await supabase.from('checklist_state').upsert({
            user_id: userId, course_slug: slug, items: op.val,
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        }
        // unknown keys: cache-only, nothing to persist
      } else if (op.kind === 'mock-insert') {
        const { error } = await supabase.from('mock_attempts').insert({
          user_id: userId, course_slug: slug, attempt: op.attempt,
        });
        if (error) throw error;
      } else {
        for (const table of ['exercise_progress', 'mock_attempts', 'checklist_state']) {
          const { error } = await supabase.from(table)
            .delete().eq('user_id', userId).eq('course_slug', slug);
          if (error) throw error;
        }
        // log the reset (best-effort; admin visibility)
        await supabase.from('progress_resets').insert({ user_id: userId, course_slug: slug });
      }
      pending.shift();
      backoffMs = 1000;
    }
  } catch {
    backoffMs = Math.min(backoffMs * 2, 30000);
    scheduleFlush(backoffMs);
  } finally {
    flushing = false;
  }
}

// ───────────────────────────────── pub/sub ──────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify(): void { listeners.forEach(fn => fn()); }
