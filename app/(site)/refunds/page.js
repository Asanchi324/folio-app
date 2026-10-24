import { getT } from '@/lib/i18n-server';
import { pageAlternates } from '@/lib/seo';
import { COMPANY, CompanyDetails, LegalLinks } from '@/lib/legal';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Refund policy'),
    description: t('How cancellations and refunds work for Folio Pro and workspace plans.'),
    alternates: await pageAlternates('/refunds'),
  };
}

const UPDATED = '2026-10-24';

export default async function RefundsPage() {
  const { t } = await getT();
  const sections = [
    [t('Prices'), [
      t('Prices are shown in US dollars before you pay. There are no setup fees or hidden charges. If tax applies in your country, it is shown at checkout before you confirm. Your bank may add its own currency-conversion fee.'),
    ]],
    [t('Cancelling'), [
      t('You can cancel any time in Settings or the billing portal — no emails or calls needed. Your plan stays active until the end of the period you paid for, and you are not charged again.'),
    ]],
    [t('Refunds'), [
      t('First payment for a plan: if Folio is not for you, write to us within 14 days and we refund it in full.'),
      t('Renewals: if you forgot to cancel and have not used paid features since the renewal, write to us within 7 days and we refund it.'),
      t('Double charges or payments for a plan that never switched on are always refunded.'),
      t('Refunds go back to the original payment method, usually within 5–10 business days depending on your bank.'),
    ]],
    [t('How to ask'), [
      t('Write to {email} from the email of your Folio account and tell us which payment it is about.', { email: COMPANY.email }),
      t('This policy does not limit any rights you have under the consumer protection laws of your country.'),
    ]],
  ];
  return (
    <div className="wrap prose" style={{ maxWidth: 760, paddingTop: 48, paddingBottom: 90 }}>
      <h1>{t('Refund policy')}</h1>
      <p className="muted">{t('Last updated: {date}', { date: UPDATED })}</p>
      {sections.map(([h, ps]) => (
        <section key={h}>
          <h2>{h}</h2>
          {ps.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
      <CompanyDetails t={t} />
      <LegalLinks t={t} current="/refunds" />
    </div>
  );
}
