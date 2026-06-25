import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={SITE.lastUpdated}>
      <p>
        This policy explains what personal data {SITE.brand} collects, why, and
        your rights. We are the data controller; contact us at{' '}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data</strong> — your email address and, optionally, a display name.</li>
        <li><strong>Learning progress</strong> — which exercises you’ve completed, mock-exam attempts and your self-assessment checklist, so you can pick up where you left off across devices.</li>
        <li><strong>Cookies &amp; analytics</strong> — an essential session cookie keeps you logged in, and we use privacy-friendly, <strong>cookieless</strong> analytics to measure page visits and performance. No advertising or third-party tracking cookies. See our <Link href="/cookies">Cookie Policy</Link>.</li>
      </ul>
      <p>
        We do <strong>not</strong> collect or store your payment-card details. Payments are handled by
        Paddle, our merchant of record.
      </p>

      <h2>Why we use it (legal basis)</h2>
      <p>
        We process this data to provide the Service you’ve asked for — creating your account, keeping
        you signed in, saving your progress and granting access to courses you’ve bought (performance
        of our contract with you).
      </p>

      <h2>Who processes it for us</h2>
      <ul>
        <li><strong>Supabase</strong> — authentication and database hosting (your account and progress).</li>
        <li><strong>Vercel</strong> — hosting and serving the application.</li>
        <li><strong>Paddle</strong> — payment processing, invoicing and tax, as merchant of record.</li>
      </ul>
      <p>These providers act on our behalf and may process data outside your country under appropriate safeguards.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account and progress for as long as your account exists. Ask us to delete your
        account and we’ll remove your personal data, except where we must retain limited records (for
        example, transaction records kept by Paddle for tax and accounting).
      </p>

      <h2>Your rights</h2>
      <p>
        You can access, correct, export or delete your personal data, and object to or restrict
        certain processing. To exercise any of these, email{' '}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. If you’re in the EU/EEA you also have the
        right to complain to your local data-protection authority.
      </p>

      <h2>Changes</h2>
      <p>We may update this policy; the “last updated” date above shows the current version.</p>

      <h2>Contact</h2>
      <p>
        Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. See also our{' '}
        <Link href="/terms">Terms</Link>, <Link href="/refunds">Refund Policy</Link> and{' '}
        <Link href="/cookies">Cookie Policy</Link>.
      </p>
    </LegalPage>
  );
}
