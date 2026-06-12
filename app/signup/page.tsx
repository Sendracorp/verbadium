import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = { title: 'Sign up' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="site-main auth-main">
        <AuthForm mode="signup" next={next || '/'} />
      </main>
    </>
  );
}
