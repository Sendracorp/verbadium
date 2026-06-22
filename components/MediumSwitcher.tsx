'use client';
import { useRouter } from 'next/navigation';
import { LOCALE_LABEL, type Locale } from '@/lib/i18n';

/* Choose the language the course is EXPLAINED in (the Catalan + audio are the
   same in every medium). Renders only when more than one medium is available
   for the course. Cookie name mirrors MEDIUM_COOKIE in lib/medium.ts. */
export default function MediumSwitcher({ current, options }: { current: Locale; options: Locale[] }) {
  const router = useRouter();
  if (options.length < 2) return null;
  return (
    <label className="medium-switcher">
      <span>Explained in</span>
      <select
        value={current}
        onChange={e => {
          document.cookie = `vb-medium=${e.target.value};path=/;max-age=31536000;samesite=lax`;
          router.refresh();
        }}
      >
        {options.map(o => <option key={o} value={o}>{LOCALE_LABEL[o]}</option>)}
      </select>
    </label>
  );
}
