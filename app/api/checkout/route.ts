import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/server';
import { getCourseMeta } from '@/lib/courses';
import { userOwnsCourse } from '@/lib/access';
import { createCheckout } from '@/lib/lemonsqueezy';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Log in to buy a course.' }, { status: 401 });
  }

  const { courseSlug } = await request.json().catch(() => ({}));
  if (!courseSlug || !getCourseMeta(courseSlug)) {
    return NextResponse.json({ error: 'Unknown course.' }, { status: 400 });
  }
  if (await userOwnsCourse(user.id, courseSlug)) {
    return NextResponse.json({ error: 'You already own this course.' }, { status: 409 });
  }

  const result = await createCheckout({ courseSlug, userId: user.id, email: user.email });
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }
  return NextResponse.json({ url: result.url });
}
