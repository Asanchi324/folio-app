import { getT } from '@/lib/i18n-server';
import { pageAlternates } from '@/lib/seo';
import { CompanyDetails, LegalLinks } from '@/lib/legal';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Privacy policy'),
    description: t('What Folio collects, why, who processes it, and how to export or delete your data.'),
    alternates: await pageAlternates('/privacy'),
  };
}

const UPDATED = '2026-10-24';

export default async function PrivacyPage() {
  const { t } = await getT();
  const sections = [
    [null, t('What we collect'), [
      t('Account: if you sign in with Google, we receive your name, email address and a user ID. We never see your Google password.'),
      t('Portfolio: what you type into Folio — grades, test scores, activities, awards, essays, your university list and deadlines.'),
      t('Payments: if you subscribe, Dodo Payments processes your card. We only store a Dodo Payments customer and subscription ID and your plan status — never card numbers.'),
      t('Visit counts: anonymous, cookie-free page-view counts (Vercel Web Analytics) for every visitor, so we know how many people use Folio. No cookies, no personal identifiers, and private IDs in links are removed.'),
      t('Analytics: only if you allow it — anonymous page views and product events (for example “opened the assessment”). Links that contain private IDs are shortened before sending.'),
    ]],
    [null, t('Why we use it'), [
      t('To save your portfolio and sync it between your devices, to calculate your assessment and admission odds, to generate AI reviews you ask for, to run school workspaces you join, and to manage subscriptions.'),
      t('We do not sell your data, show ads, or use your portfolio for marketing.'),
    ]],
    [null, t('Who processes it'), [
      t('Google Firebase (sign-in and database), Vercel (hosting and cookie-free visit counts), Dodo Payments (payments), Google Analytics (only with your consent).'),
      t('AI providers (Groq, OpenRouter, Google Gemini) receive the part of your portfolio needed to answer a specific AI request. Only the current portfolio is sent — never your email or payment details.'),
      t('These are the only third-party services and SDKs in Folio. Fonts are served from our own domain, so opening the site sends nothing to font providers.'),
    ]],
    [null, t('Who can see your portfolio'), [
      t('Only you. A school or counselor sees it only after you accept their invitation, and loses access the moment you disconnect. A public link shows only the sections you choose and can be switched off at any time.'),
    ]],
    ['cookies', t('Cookies and local storage'), [
      t('Necessary: sign-in session, your language (folio_lang) and your cookie choice (folio_consent). Your portfolio is also cached in your browser so it works offline.'),
      t('Optional: Google Analytics cookies, set only after you click “Allow analytics”. You can change your choice in Settings at any time.'),
    ]],
    ['rights', t('Your rights'), [
      t('In Settings you can download your whole portfolio as a file and delete your portfolio and account. You can also write to us to access, correct or delete your data.'),
      t('To request deletion without signing in, email us from the address of your account with the subject “Delete my data”. We confirm and delete within 30 days, usually much sooner.'),
    ]],
    ['children', t('Students under 16'), [
      t('Folio is made for high-school students. If you are under 16, use it with the permission of a parent or guardian. We ask only for what the portfolio needs, never show ads and never sell data.'),
      t('A parent or guardian can ask us to see or delete a child’s data at any time by email.'),
    ]],
    ['emails', t('Emails'), [
      t('We send only emails about your account and the deadlines you track — no marketing. Every non-essential email has an unsubscribe link, and you can also reply “unsubscribe” or write to us.'),
    ]],
    [null, t('How long we keep data'), [
      t('As long as your account exists. When you delete it, your portfolio, chat history and public link are removed immediately; billing records required by law are kept by Dodo Payments.'),
    ]],
  ];
  return (
    <div className="wrap prose" style={{ maxWidth: 760, paddingTop: 48, paddingBottom: 90 }}>
      <h1>{t('Privacy policy')}</h1>
      <p className="muted">{t('Last updated: {date}', { date: UPDATED })}</p>
      {sections.map(([id, h, ps]) => (
        <section key={h} id={id || undefined}>
          <h2>{h}</h2>
          {ps.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
      <h2>{t('Contact')}</h2>
      <p>
        {t('Questions or requests:')} <a className="link" href="mailto:temirbekov.assan@outlook.com">temirbekov.assan@outlook.com</a>.
      </p>
      <CompanyDetails t={t} />
      <LegalLinks t={t} current="/privacy" />
    </div>
  );
}
