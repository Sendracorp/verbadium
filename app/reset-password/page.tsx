import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import AuthForm from '@/components/AuthForm';
import { preferredMedium } from '@/lib/medium';

export const metadata: Metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage() {
  const l = (await preferredMedium()) ?? 'en';
  return (
    <>
      <SiteHeader lang={l} />
      <main className="site-main auth-main">
        <AuthForm mode="reset" lang={l} />
      </main>
    </>
  );
}
