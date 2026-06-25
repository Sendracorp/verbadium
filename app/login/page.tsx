import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import AuthForm from '@/components/AuthForm';
import { preferredMedium } from '@/lib/medium';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, lang] = await Promise.all([searchParams, preferredMedium()]);
  const l = lang ?? 'en';
  return (
    <>
      <SiteHeader lang={l} />
      <main className="site-main auth-main">
        <AuthForm mode="login" next={next || '/'} lang={l} />
      </main>
    </>
  );
}
