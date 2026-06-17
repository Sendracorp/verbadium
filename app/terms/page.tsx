import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Terms & Conditions' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated={SITE.lastUpdated}>
      <p>
        These Terms &amp; Conditions govern your use of {SITE.brand} (the “Service”), operated by{' '}
        {SITE.legalName} (“we”, “us”), based in {SITE.country}. By creating an account or buying a
        course you agree to these terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        {SITE.brand} provides self-paced, online language courses: interactive lessons, exercises,
        a mock exam, a glossary with audio, and progress tracking. The first unit of each course,
        the IPA guide and the exam information are available free without an account.
      </p>

      <h2>2. Accounts</h2>
      <p>
        Some features require an account. You agree to provide accurate information, to keep your
        login credentials secure, and to be responsible for activity under your account. Accounts
        are personal to one individual and must not be shared.
      </p>

      <h2>3. Purchases, pricing and payment</h2>
      <p>
        Each course is a one-time purchase that grants lifetime access to that course for personal
        use. Prices are shown on the course and <Link href="/pricing">pricing</Link> pages excluding
        tax; any VAT or sales tax due in your location is calculated and added at checkout.
      </p>
      <p>
        Payments are processed by <strong>Paddle.com</strong>, which acts as the merchant of record
        and reseller for all purchases. Paddle handles billing, invoicing and tax, and your purchase
        is also subject to{' '}
        <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener">
          Paddle’s Buyer Terms
        </a>.
      </p>

      <h2>4. Licence and acceptable use</h2>
      <p>
        On purchase we grant you a personal, non-exclusive, non-transferable licence to access the
        course for your own learning. You may not share, resell, sublicense, publish, or redistribute
        the course content, share your account, or attempt to circumvent the paywall or access the
        Service by automated means.
      </p>

      <h2>5. Intellectual property</h2>
      <p>
        All course content is owned by {SITE.legalName} unless stated otherwise. Native-speaker
        pronunciation recordings are sourced from the Lingua Libre project via Wikimedia Commons and
        are used under the CC BY-SA 4.0 licence, with attribution shown on the glossary page.
      </p>

      <h2>6. Refunds</h2>
      <p>
        Our <Link href="/refunds">Refund Policy</Link> forms part of these terms: a full refund is
        available within 14 days as long as you haven’t started the paid course material; once you
        begin it (or after 14 days) courses are non-refundable. See the policy for details, exceptions
        and your statutory rights.
      </p>

      <h2>7. Availability and changes</h2>
      <p>
        We aim to keep the Service available and to improve and update course content over time, but
        we do not guarantee uninterrupted availability. The courses are educational materials; we do
        not guarantee any particular result, including passing any official exam.
      </p>

      <h2>8. Disclaimers and liability</h2>
      <p>
        The Service is provided “as is”. To the maximum extent permitted by law, our total liability
        to you for any claim relating to the Service is limited to the amount you paid for the
        relevant course. Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>9. Termination</h2>
      <p>
        We may suspend or terminate access if you breach these terms. You can stop using the Service
        and request deletion of your account at any time (see our <Link href="/privacy">Privacy Policy</Link>).
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Material changes will be reflected by the “last
        updated” date above; continued use of the Service means you accept the updated terms.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws of {SITE.jurisdiction}, without prejudice to any
        mandatory consumer-protection rights you have where you live.
      </p>

      <h2>12. Contact</h2>
      <p>
        {SITE.legalName}{SITE.address ? ` · ${SITE.address}` : ''} · {SITE.country}<br />
        Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>{SITE.phone ? ` · Phone: ${SITE.phone}` : ''}
        <br />See our <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
