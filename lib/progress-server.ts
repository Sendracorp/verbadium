import 'server-only';
import { getServerSupabase } from './supabase/server';
import type { ExProgress, MockAttempt } from './progress';

/** All of a user's progress for one course, shaped as the progress-store
    key/value map that <ProgressProvider> seeds on the client. */
export async function loadInitialProgress(
  userId: string, courseSlug: string,
): Promise<Record<string, unknown>> {
  const supabase = await getServerSupabase();
  if (!supabase) return {};
  try {
    const [ex, mock, checklist] = await Promise.all([
      supabase.from('exercise_progress')
        .select('exercise_id, state, score, total, updated_at')
        .eq('user_id', userId).eq('course_slug', courseSlug),
      supabase.from('mock_attempts')
        .select('attempt').eq('user_id', userId).eq('course_slug', courseSlug)
        .order('created_at', { ascending: true }),
      supabase.from('checklist_state')
        .select('items').eq('user_id', userId).eq('course_slug', courseSlug).maybeSingle(),
    ]);
    const kv: Record<string, unknown> = {};
    for (const row of ex.data ?? []) {
      kv['ex.' + row.exercise_id] = {
        state: row.state, score: row.score, total: row.total,
        ts: row.updated_at ? Date.parse(row.updated_at) : undefined,
      } satisfies ExProgress;
    }
    kv['mock.attempts'] = (mock.data ?? []).map(r => r.attempt as MockAttempt);
    if (checklist.data) kv['checklist'] = checklist.data.items;
    return kv;
  } catch { return {}; }
}

/** Passed-exercise count for the catalog's per-course progress bar. */
export async function countPassedExercises(userId: string, courseSlug: string): Promise<number> {
  const supabase = await getServerSupabase();
  if (!supabase) return 0;
  try {
    const { count } = await supabase.from('exercise_progress')
      .select('exercise_id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('course_slug', courseSlug).eq('state', 'passed');
    return count ?? 0;
  } catch { return 0; }
}
