import './globals.css';
import { Inter, Unbounded, Days_One } from 'next/font/google';
import { I18nProvider } from '@/lib/i18n';
import { getLang, dictFor, getT } from '@/lib/i18n-server';
import { LANGS } from '@/lib/i18n-core';
import Analytics from '@/components/Analytics';
import VisitCounter from '@/components/VisitCounter';
import { SITE_URL, SITE_NAME, ogLocale } from '@/lib/seo';

// Fonts are downloaded at build time and served from our own domain — no
// request to Google when someone opens the site. All three are SIL OFL.
const inter = Inter({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], weight: ['400', '500', '600', '700'], variable: '--font-inter', display: 'swap' });
const unbounded = Unbounded({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], weight: ['600', '700'], variable: '--font-unbounded', display: 'swap' });
const daysOne = Days_One({ subsets: ['latin', 'cyrillic'], weight: '400', variable: '--font-days-one', display: 'swap' });

// NEXT_PUBLIC_GA_ID = GA4 Measurement ID. Unset → no analytics and no banner.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Search terms per language — students in KZ/CIS search in Russian and Kazakh.
const KEYWORDS = {
  en: ['admissions portfolio', 'college application', 'Common App activities', 'university admission chances',
    'study abroad', 'college essay feedback', 'SAT', 'IELTS', 'scholarships', 'olympiads', 'Folio'],
  ru: ['поступление за границу', 'портфолио для поступления', 'поступление в США', 'шансы поступления',
    'Common App', 'мотивационное эссе', 'SAT', 'IELTS', 'гранты и стипендии', 'олимпиады', 'Folio'],
  kk: ['шетелге түсу', 'түсуге арналған портфолио', 'АҚШ университеттері', 'түсу мүмкіндігі',
    'Common App', 'эссе', 'SAT', 'IELTS', 'гранттар', 'олимпиадалар', 'Folio'],
};

export async function generateMetadata() {
  const { t, lang } = await getT();
  const title = t('Folio — admissions portfolio, honest AI review and real chances');
  const description = t(
    'Folio turns your grades, tests, activities and essays into one admissions portfolio, gives personal feedback on every part, builds a daily plan and shows your chances at 800+ universities.'
  );
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s · Folio' },
    description,
    applicationName: SITE_NAME,
    keywords: KEYWORDS[lang] || KEYWORDS.en,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'education',
    openGraph: {
      siteName: SITE_NAME,
      type: 'website',
      url: '/',
      title,
      description,
      locale: ogLocale(lang),
      alternateLocale: ['en_US', 'ru_RU', 'kk_KZ'].filter((l) => l !== ogLocale(lang)),
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    // Optional HTML-tag verification (Search Console / Yandex Webmaster) —
    // not needed when the domain was verified by DNS.
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    },
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'default' },
    formatDetection: { telephone: false, email: false, address: false },
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
    <html lang={htmlLang} className={`${inter.variable} ${unbounded.variable} ${daysOne.variable}`}>
      <body>
        <I18nProvider lang={lang} dict={dictFor(lang)}>
          {children}
          <Analytics gaId={GA_ID} />
          <VisitCounter />
        </I18nProvider>
      </body>
    </html>
  );
}
