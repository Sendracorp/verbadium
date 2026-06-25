import { NextResponse } from 'next/server';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getCourseContent } from '@/lib/content';
import { familyOf } from '@/lib/courses';
import { extractCatalog } from '@/lib/i18n-course';

/* Admin-only: dump the English translation catalog for a course (the source for
   translators). Save the output to i18n/<slug>.en.json, copy it to
   i18n/<slug>.<medium>.json and translate the values. Re-run after content
   changes to pick up new/changed keys. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const s = await getServerSupabase();
  const { data } = await s!.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!data?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  // Always the English source catalog — the family's base content (its English
  // variant's slug equals the family name).
  const family = familyOf(slug);
  const course = family ? getCourseContent(family) : null;
  if (!course) return NextResponse.json({ error: 'Unknown course' }, { status: 404 });
  return NextResponse.json(extractCatalog(course));
}
