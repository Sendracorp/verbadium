'use server';
import { revalidatePath } from 'next/cache';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { nativeKey } from '@/lib/native-audio-key';

/* All admin mutations. Each re-verifies the caller is an admin server-side,
   then uses the service-role client. Never trust the client. */
async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error('Not signed in');
  const s = await getServerSupabase();
  const { data } = await s!.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!data?.is_admin) throw new Error('Forbidden');
  return user;
}

export async function grantAccess(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  const courseSlug = String(formData.get('courseSlug') || '');
  const note = String(formData.get('note') || '') || null;
  const a = getAdminSupabase();
  if (a && userId && courseSlug) {
    // Idempotent: skip if the user already has an active grant for this course.
    const { data: existing } = await a.from('access_grants').select('id')
      .eq('user_id', userId).eq('course_slug', courseSlug).is('revoked_at', null).limit(1);
    if (!existing?.length) {
      await a.from('access_grants').insert({ user_id: userId, course_slug: courseSlug, granted_by: admin.id, note });
    }
  }
  revalidatePath(`/admin/users/${userId}`);
}

export async function revokeGrant(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('grantId') || '');
  const userId = String(formData.get('userId') || '');
  const a = getAdminSupabase();
  if (a && id) await a.from('access_grants').update({ revoked_at: new Date().toISOString() }).eq('id', id);
  revalidatePath(`/admin/users/${userId}`);
}

export async function setPurchaseStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('purchaseId') || '');
  const status = String(formData.get('status') || '');
  const userId = String(formData.get('userId') || '');
  const a = getAdminSupabase();
  if (a && id && (status === 'paid' || status === 'refunded')) {
    await a.from('purchases').update({
      status, refunded_at: status === 'refunded' ? new Date().toISOString() : null,
    }).eq('id', id);
  }
  revalidatePath(`/admin/users/${userId}`);
}

export async function toggleAdmin(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get('userId') || '');
  const makeAdmin = formData.get('makeAdmin') === 'true';
  const a = getAdminSupabase();
  if (a && userId) await a.from('profiles').update({ is_admin: makeAdmin }).eq('id', userId);
  revalidatePath(`/admin/users/${userId}`);
}

export async function resetUserProgress(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get('userId') || '');
  const courseSlug = String(formData.get('courseSlug') || '');
  const a = getAdminSupabase();
  if (a && userId && courseSlug) {
    for (const t of ['exercise_progress', 'mock_attempts', 'checklist_state']) {
      await a.from(t).delete().eq('user_id', userId).eq('course_slug', courseSlug);
    }
    await a.from('progress_resets').insert({ user_id: userId, course_slug: courseSlug });
  }
  revalidatePath(`/admin/users/${userId}`);
}

const AUDIO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
  'audio/ogg': 'ogg', 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac',
};

/* Upload/replace an admin recording for a course text. The audio goes to the
   public 'course-audio' bucket; the row maps the text → file. Override wins at
   runtime over native/TTS. */
export async function uploadAudioOverride(formData: FormData) {
  const admin = await requireAdmin();
  const courseSlug = String(formData.get('courseSlug') || '');
  const text = String(formData.get('text') || '').trim();   // the Catalan phrase
  const file = formData.get('file');
  if (!courseSlug || !text || !(file instanceof File) || file.size === 0) return;
  const a = getAdminSupabase();
  if (!a) return;

  const key = nativeKey(text);
  const ext = AUDIO_EXT[file.type] || 'webm';
  const safe = key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'audio';
  const path = `${courseSlug}/${safe}-${key.length}.${ext}`;   // stable-ish; upsert overwrites
  const buf = Buffer.from(await file.arrayBuffer());
  const up = await a.storage.from('course-audio').upload(path, buf, { contentType: file.type || 'audio/webm', upsert: true });
  if (up.error) throw new Error('Upload failed: ' + up.error.message);
  await a.from('audio_overrides').upsert(
    { course_slug: courseSlug, text_key: key, label: text, storage_path: path, recorded_by: admin.id, updated_at: new Date().toISOString() },
    { onConflict: 'course_slug,text_key' },
  );
  revalidatePath('/admin/audio');
}

export async function deleteAudioOverride(formData: FormData) {
  await requireAdmin();
  const courseSlug = String(formData.get('courseSlug') || '');
  const textKey = String(formData.get('textKey') || '');
  const a = getAdminSupabase();
  if (a && courseSlug && textKey) {
    const { data } = await a.from('audio_overrides').select('storage_path')
      .eq('course_slug', courseSlug).eq('text_key', textKey).maybeSingle();
    if (data?.storage_path) await a.storage.from('course-audio').remove([data.storage_path]);
    await a.from('audio_overrides').delete().eq('course_slug', courseSlug).eq('text_key', textKey);
  }
  revalidatePath('/admin/audio');
}
