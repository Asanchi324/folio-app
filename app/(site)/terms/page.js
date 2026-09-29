import Link from 'next/link';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Terms of use'),
    description: t('The rules for using Folio, its AI tools and paid plans.'),
    alternates: { canonical: '/terms' },
  };
}

export default async function TermsPage() {
  const { t } = await getT();
  const sections = [
    [t('The service'), t('Folio helps you organise an admissions portfolio, estimates your chances and offers AI feedback. It is guidance, not a guarantee: admission decisions are made by universities, and estimates can be wrong.')],
    [t('Your content'), t('You own everything you add. You give us permission to store and process it only to provide the service to you. Do not add content that is not yours or that you are not allowed to share.')],
    [t('AI features'), t('AI suggestions can contain mistakes. Check every fact before using it in an application. Do not submit AI-written text as your own where a university forbids it.')],
    [t('Paid plans'), t('Subscriptions renew monthly until cancelled. You can cancel any time from Settings or the billing portal; access continues until the end of the paid period. Prices are shown before checkout.')],
    [t('School workspaces'), t('Workspace owners are responsible for inviting only students who agreed to join. Students can disconnect at any time.')],
    [t('Fair use'), t('Do not attempt to break, overload or scrape the service, or to access other people’s data. We may limit or suspend accounts that do.')],
    [t('Changes'), t('We may update these terms; the date below shows the latest version. Continuing to use Folio means you accept the updated terms.')],
  ];
  return (
    <div className="wrap prose" style={{ maxWidth: 760, paddingTop: 48, paddingBottom: 90 }}>
      <h1>{t('Terms of use')}</h1>
      <p className="muted">{t('Last updated: {date}', { date: '2026-09-29' })}</p>
      {sections.map(([h, p]) => (
        <section key={h}>
          <h2>{h}</h2>
          <p>{p}</p>
        </section>
      ))}
      <p style={{ marginTop: 30 }}>
        <Link className="link" href="/privacy">{t('Privacy policy')}</Link>
      </p>
    </div>
  );
}
