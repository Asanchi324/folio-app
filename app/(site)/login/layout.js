import { getT } from '@/lib/i18n-server';
import { pageAlternates } from '@/lib/seo';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Sign in'),
    description: t('Sign in to Folio with Google to keep your portfolio safe and use it on any device.'),
    alternates: await pageAlternates('/login'),
    // Thin page — keep it out of results, but let crawlers follow its links.
    robots: { index: false, follow: true },
  };
}

export default function Layout({ children }) {
  return children;
}
