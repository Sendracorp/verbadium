import 'server-only';
import type { Course } from './types';
import { getCourse } from './course';

/* Maps a catalog slug to its parsed content. New courses plug in here. */
export function getCourseContent(slug: string): Course | null {
  if (slug === 'catalan-a1') return getCourse();
  return null;
}
