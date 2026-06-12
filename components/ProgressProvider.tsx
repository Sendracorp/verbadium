'use client';
import { useRef } from 'react';
import { configureProgress } from '@/lib/progress';

/* Seeds the progress store before any course UI mounts. Configured during
   render (guarded by signature) so children's effects read seeded state. */
export default function ProgressProvider({ userId, courseSlug, initial, children }: {
  userId: string | null;
  courseSlug: string;
  initial: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const sig = `${userId ?? ''}|${courseSlug}`;
  const last = useRef<string | null>(null);
  if (last.current !== sig) {
    last.current = sig;
    configureProgress({ userId, courseSlug, initial });
  }
  return <>{children}</>;
}
