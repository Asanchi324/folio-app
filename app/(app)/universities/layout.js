import { getT } from '@/lib/i18n-server';
import { pageAlternates } from '@/lib/seo';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('University admission chances'),
    description: t('Your admission chances at 800+ universities, ranked and filterable (Top 20, Top 50, Top 100), from real admission data and your profile.'),
    // App pages default to noindex; these two are public, useful content.
    robots: { index: true, follow: true },
    alternates: await pageAlternates('/universities'),
  };
}

export default function Layout({ children }) {
  return children;
}
