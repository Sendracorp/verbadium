import 'server-only';
import { unstable_cache } from 'next/cache';
import { getAdminSupabase } from './supabase/admin';
import { SUPABASE_URL } from './supabase/config';

const publicUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/course-audio/${path}`;

/** text_key → public audio URL for a course's admin-recorded overrides.
    Cached 60s so course pages don't query per request; uploads appear within a minute. */
export function getAudioOverrides(courseSlug: string): Promise<Record<string, string>> {
  return unstable_cache(
    async () => {
      const a = getAdminSupabase();
      if (!a) return {};
      const { data } = await a.from('audio_overrides').select('text_key, storage_path').eq('course_slug', courseSlug);
      const map: Record<string, string> = {};
      for (const r of data ?? []) map[r.text_key] = publicUrl(r.storage_path);
      return map;
    },
    ['audio-overrides', courseSlug],
    { revalidate: 60 },
  )();
}

/** Full list (with labels) for the admin manager. */
export async function listAudioOverrides(courseSlug: string) {
  const a = getAdminSupabase();
  if (!a) return [] as { text_key: string; label: string | null; url: string; created_at: string }[];
  const { data } = await a.from('audio_overrides')
    .select('text_key, label, storage_path, created_at').eq('course_slug', courseSlug)
    .order('created_at', { ascending: false });
  return (data ?? []).map(r => ({ text_key: r.text_key, label: r.label, url: publicUrl(r.storage_path), created_at: r.created_at }));
}
