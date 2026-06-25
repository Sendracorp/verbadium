'use client';
import { useEffect } from 'react';

/* On a localized marketing page, remember the visitor's language as a SOFT
   preference (the catalog's course chooser starts on it — see preferredMedium
   in lib/medium.ts). It never decides which course renders; each language is
   its own course, so the variant slug does. Cookie mirrors MEDIUM_COOKIE. */
export default function SetMedium({ lang }: { lang: string }) {
  useEffect(() => {
    document.cookie = `vb-medium=${lang};path=/;max-age=31536000;samesite=lax`;
  }, [lang]);
  return null;
}
