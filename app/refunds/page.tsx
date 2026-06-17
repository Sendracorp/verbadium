import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Refund Policy' };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy" updated={SITE.lastUpdated}>
      <p>
        This policy explains refunds for course purchases on {SITE.brand}, operated by {SITE.legalName}.
      </p>

      <h2>All purchases are final</h2>
      <p>
        Our courses are digital content that give you immediate, lifetime access to all the material,
        so <strong>all sales are final and purchases are non-refundable</strong>. Please use the free
        preview before buying — Unit 1 of every course, the IPA guide and the exam information are
        available free, with no account required, so you can see exactly what you’re getting.
      </p>

      <h2>Your right of withdrawal (EU consumers)</h2>
      <p>
        EU consumers normally have a 14-day right of withdrawal for online purchases. For digital
        content this right ends once supply begins with your prior consent. At checkout you expressly
        agree to immediate access and acknowledge that you waive the 14-day right of withdrawal — which
        is what makes purchases final.
      </p>

      <h2>If something’s wrong</h2>
      <p>
        This doesn’t affect your statutory consumer rights. If the course doesn’t work and we can’t
        fix it, or you were charged twice or by accident, contact us and we’ll put it right.
      </p>

      <h2>How to contact us</h2>
      <p>
        Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with the order or receipt ID from the
        confirmation email sent by Paddle (our payment provider and merchant of record). Where a refund
        is granted, it is issued by Paddle to your original payment method, normally within 14 days of
        approval.
      </p>

      <p className="note">
        {SITE.legalName} · Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        {SITE.phone ? ` · Phone ${SITE.phone}` : ''}. See also our{' '}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>
    </LegalPage>
  );
}
