import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { getLang, dictFor, getT } from '@/lib/i18n-server';
import { LANGS } from '@/lib/i18n-core';
import Analytics from '@/components/Analytics';

// NEXT_PUBLIC_GA_ID = GA4 Measurement ID. Unset → no analytics and no banner.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://foli0.vercel.app';

export async function generateMetadata() {
  const { t, lang } = await getT();
  const title = t('Folio — admissions portfolio, honest AI review and real chances');
  const description = t(
    'Build a Common App–style portfolio, get an honest AI review of every activity, see realistic admission odds for 100+ universities, and find olympiads and programs worth your time.'
  );
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s · Folio' },
    description,
    applicationName: 'Folio',
    openGraph: {
      siteName: 'Folio',
      type: 'website',
      title,
      description,
      locale: lang === 'ru' ? 'ru_RU' : lang === 'kk' ? 'kk_KZ' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export const viewport = {
  themeColor: '#f6f4ee',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }) {
  const lang = await getLang();
  const htmlLang = LANGS.find((l) => l.code === lang)?.htmlLang || 'en';
  return (
    <html lang={htmlLang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Days+One&family=Inter:wght@400;500;600;700&family=Unbounded:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider lang={lang} dict={dictFor(lang)}>
          {children}
          <Analytics gaId={GA_ID} />
        </I18nProvider>
      </body>
    </html>
  );
}
