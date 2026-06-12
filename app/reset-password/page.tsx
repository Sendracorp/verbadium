import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = { title: 'Choose a new password' };

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="site-main auth-main">
        <AuthForm mode="reset" />
      </main>
    </>
  );
}
