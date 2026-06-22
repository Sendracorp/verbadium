'use client';
import { useEffect } from 'react';

/* On a localized marketing page, remember the visitor's language as their
   preferred teaching medium, so clicking into the course picks it up (once that
   medium is available — see AVAILABLE_MEDIUMS). Cookie name mirrors
   MEDIUM_COOKIE in lib/medium.ts. */
export default function SetMedium({ lang }: { lang: string }) {
  useEffect(() => {
    document.cookie = `vb-medium=${lang};path=/;max-age=31536000;samesite=lax`;
  }, [lang]);
  return null;
}
