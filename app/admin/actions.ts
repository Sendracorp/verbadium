'use server';
import { revalidatePath } from 'next/cache';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

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
