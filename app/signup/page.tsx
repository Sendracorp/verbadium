import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import AuthForm from '@/components/AuthForm';
import { preferredMedium } from '@/lib/medium';

export const metadata: Metadata = { title: 'Sign up' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, lang] = await Promise.all([searchParams, preferredMedium()]);
  const l = lang ?? 'en';
  return (
    <>
      <SiteHeader lang={l} />
      <main className="site-main auth-main">
        <AuthForm mode="signup" next={next || '/'} lang={l} />
      </main>
    </>
  );
}
