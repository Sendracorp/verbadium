'use client';
import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution';

/* Mounts once on initial page load (in the root layout) and records first-touch
   campaign attribution for the session. Renders nothing. */
export default function AttributionTracker() {
  useEffect(() => { captureAttribution(); }, []);
  return null;
}
