import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import AuthForm from '@/components/AuthForm';
import { preferredMedium } from '@/lib/medium';

export const metadata: Metadata = { title: 'Reset password' };

export default async function ForgotPasswordPage() {
  const l = (await preferredMedium()) ?? 'en';
  return (
    <>
      <SiteHeader lang={l} />
      <main className="site-main auth-main">
        <AuthForm mode="forgot" lang={l} />
      </main>
    </>
  );
}
