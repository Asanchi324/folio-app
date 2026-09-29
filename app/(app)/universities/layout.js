import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('University admission chances'),
    description: t('Realistic admission odds at 100+ universities in the US, UK and Canada, calculated from your grades, test scores and activities.'),
    // App pages default to noindex; these two are public, useful content.
    robots: { index: true, follow: true },
    alternates: { canonical: '/universities' },
  };
}

export default function Layout({ children }) {
  return children;
}
