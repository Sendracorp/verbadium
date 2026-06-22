'use client';
import { createContext, useContext } from 'react';
import { tUI } from '@/lib/ui';
import type { Locale } from '@/lib/i18n';

/* Carries the chosen teaching medium to client components in the course shell,
   so chrome strings localize. Server components take a `locale` prop and call
   tUI() directly instead. */
const Ctx = createContext<Locale>('en');

export function CourseLocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

export function useLocale(): Locale {
  return useContext(Ctx);
}

/** Bound chrome translator: t('btn.check') / t('nav.unit', { n: 3 }). */
export function useUI() {
  const locale = useContext(Ctx);
  return (key: string, vars?: Record<string, string | number>) => tUI(locale, key, vars);
}
