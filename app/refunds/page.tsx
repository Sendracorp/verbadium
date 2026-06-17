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

      <h2>14-day refund if you haven’t started the paid course</h2>
      <p>
        Within <strong>14 days</strong> of your purchase you can request a full refund, as long as you
        <strong> haven’t started working through the paid material</strong> — that is, your account
        shows no completed or attempted exercises and no mock-exam attempts beyond the free Unit 1
        preview. Because your progress is saved to your account, we can verify this quickly. The free
        preview (Unit 1, the IPA guide and the exam information) doesn’t count against you — try it
        before you buy.
      </p>
      <p>
        Once you’ve begun the paid units, or after 14 days, the course is <strong>non-refundable</strong>,
        since you keep full lifetime access to all of its content.
      </p>

      <h2>Your right of withdrawal (EU consumers)</h2>
      <p>
        EU consumers normally have a 14-day right of withdrawal for online purchases. For digital
        content, this right ends once supply has begun with your prior consent: at checkout you agree
        to immediate access and acknowledge that, once you start the paid content, the statutory right
        of withdrawal no longer applies. Our 14-day "not started" refund above is offered voluntarily
        on top of that.
      </p>

      <h2>Exceptions — when we’ll always help</h2>
      <p>Regardless of the above, contact us if:</p>
      <ul>
        <li>A technical problem prevents you from using the course and we’re unable to resolve it.</li>
        <li>You were charged twice or by accident.</li>
      </ul>

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
