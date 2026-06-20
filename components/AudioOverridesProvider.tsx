'use client';
import { useRef } from 'react';
import { setAudioOverrides } from '@/lib/speech';

/* Registers a course's admin-recorded audio overrides so speak() can prefer
   them. Set during render (guarded) so they're ready before any play. */
export default function AudioOverridesProvider({ map }: { map: Record<string, string> }) {
  const sig = useRef<string | null>(null);
  const next = JSON.stringify(map);
  if (sig.current !== next) { sig.current = next; setAudioOverrides(map); }
  return null;
}
