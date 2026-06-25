'use client';
import { usePathname, useRouter } from 'next/navigation';
import { LOCALE_LABEL, type Locale } from '@/lib/i18n';
import { useUI } from './CourseLocale';

/* Switch the language the course is taught in. Each language is its own course
   (variant), so this navigates to the sibling variant's URL — keeping the same
   sub-page — rather than toggling a display setting. If the learner doesn't own
   the chosen language, they land on its preview/paywall, as expected.
   Renders only when the course has more than one language variant. */
export default function MediumSwitcher({ current, variants }:
  { current: Locale; variants: { medium: Locale; slug: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useUI();
  if (variants.length < 2) return null;
  const currentSlug = variants.find(v => v.medium === current)?.slug;
  return (
    <label className="medium-switcher">
      <span>{t('ui.explainedIn')}</span>
      <select
        value={current}
        onChange={e => {
          const target = variants.find(v => v.medium === e.target.value);
          if (!target || !currentSlug) return;
          router.push(pathname.replace(`/courses/${currentSlug}`, `/courses/${target.slug}`));
        }}
      >
        {variants.map(v => <option key={v.medium} value={v.medium}>{LOCALE_LABEL[v.medium]}</option>)}
      </select>
    </label>
  );
}
