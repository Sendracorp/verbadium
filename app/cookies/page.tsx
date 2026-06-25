import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated={SITE.lastUpdated}>
      <p>
        This page explains the cookies and similar storage {SITE.brand} uses. We keep this
        deliberately minimal: only what the site needs to work, plus privacy-friendly analytics.
        We do <strong>not</strong> use advertising or third-party tracking cookies, and we do not
        build advertising profiles or sell your data.
      </p>

      <h2>Strictly necessary</h2>
      <ul>
        <li><strong>Authentication</strong> — when you sign in, our authentication provider (Supabase)
          sets a session cookie so you stay logged in and your account stays secure. The site cannot
          function for signed-in users without it.</li>
        <li><strong>Payments</strong> — during checkout, Paddle (our merchant of record) may set
          cookies that are strictly necessary to process your payment securely.</li>
      </ul>

      <h2>Functional</h2>
      <ul>
        <li><strong>Language preference</strong> — a small cookie (<code>vb-medium</code>) remembers
          the course language you last viewed, so the catalog starts on it.</li>
        <li><strong>Local storage</strong> — your browser stores your in-progress answers and progress
          (so a free preview works without an account), minor interface preferences, and the fact that
          you’ve dismissed the cookie notice. This stays on your device and is not used for tracking.</li>
      </ul>

      <h2>Analytics</h2>
      <p>
        We use <strong>Vercel Web Analytics</strong> and <strong>Speed Insights</strong> to understand
        which pages are visited and how the site performs. These are{' '}
        <strong>cookieless and privacy-friendly</strong>: they store no cookies, collect no personally
        identifiable information, and do not track you across other websites. Because of this, no
        consent is required and there is nothing to opt out of for tracking.
      </p>

      <h2>Managing cookies</h2>
      <p>
        Since we use no non-essential tracking cookies, there is no tracking to switch off. You can
        clear cookies and local storage at any time through your browser settings — note that blocking
        the authentication cookie will stop you from signing in.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. See also our{' '}
        <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link>.
      </p>
    </LegalPage>
  );
}
