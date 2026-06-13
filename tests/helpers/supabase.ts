import { existsSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Workers re-import this module, so load .env.local here too (not only in the config).
if (existsSync('.env.local')) { try { process.loadEnvFile('.env.local'); } catch { /* ignore */ } }

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/** True when real Supabase credentials are present (not placeholders). */
export const supabaseConfigured =
  /^https:\/\/(?!YOUR-PROJECT)[a-z0-9-]+\.supabase\.co$/i.test(URL) &&
  SVC.length > 20 && !SVC.startsWith('YOUR-');

export function adminClient(): SupabaseClient {
  return createClient(URL, SVC, { auth: { persistSession: false } });
}

export interface TestOwner { userId: string; email: string; password: string }

/** Create a confirmed user who owns catalan-a1. Cleaned up by deleteUser
    (FK cascade removes the purchase + any progress). */
export async function createOwner(admin: SupabaseClient, index = 0): Promise<TestOwner> {
  const email = `catalan-e2e-${Date.now()}-${index}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = 'Test-passw0rd!';
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const userId = data.user.id;
  const { error: pe } = await admin.from('purchases').insert({
    user_id: userId, course_slug: 'catalan-a1',
    provider_order_id: `e2e-${userId}`, status: 'paid', amount_cents: 500, currency: 'USD',
  });
  if (pe) throw pe;
  return { userId, email, password };
}

export async function deleteOwner(admin: SupabaseClient, userId: string): Promise<void> {
  await admin.auth.admin.deleteUser(userId);
}
