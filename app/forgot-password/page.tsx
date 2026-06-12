import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = { title: 'Reset password' };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="site-main auth-main">
        <AuthForm mode="forgot" />
      </main>
    </>
  );
}
