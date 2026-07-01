'use client';
import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';

/* Client-side ownership + progress, so the static (CDN-served) marketing pages
   can still show the correct CTA to signed-in owners without a per-request
   server render. Mirrors userOwnsCourse()/countPassedExercises() but runs in
   the browser against the user's own rows (RLS-scoped: purchases, grants and
   exercise_progress are all readable by their owner). Starts empty — matching
   the server-rendered logged-out HTML — then fills in after mount. */

export interface OwnedInfo { passed: number }
export type OwnedMap = Record<string, OwnedInfo>;   // keyed by course_slug

export function useOwnedCourses(): OwnedMap {
  const [owned, setOwned] = useState<OwnedMap>({});

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    let active = true;

    (async () => {
      const { data } = await sb.auth.getSession();
      const uid = data.session?.user?.id;
      if (!uid) return;

      const [paid, grants] = await Promise.all([
        sb.from('purchases').select('course_slug').eq('user_id', uid).eq('status', 'paid'),
        sb.from('access_grants').select('course_slug').eq('user_id', uid).is('revoked_at', null),
      ]);
      const slugs = [...new Set<string>([
        ...((paid.data ?? []) as { course_slug: string }[]).map(r => r.course_slug),
        ...((grants.data ?? []) as { course_slug: string }[]).map(r => r.course_slug),
      ])];
      if (!slugs.length) return;

      const entries = await Promise.all(slugs.map(async slug => {
        const { count } = await sb.from('exercise_progress')
          .select('exercise_id', { count: 'exact', head: true })
          .eq('user_id', uid).eq('course_slug', slug).eq('state', 'passed');
        return [slug, { passed: count ?? 0 }] as const;
      }));
      if (active) setOwned(Object.fromEntries(entries));
    })();

    return () => { active = false; };
  }, []);

  return owned;
}
