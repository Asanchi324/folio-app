import { getT } from '@/lib/i18n-server';
import { pageAlternates } from '@/lib/seo';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Olympiads, programs and scholarships'),
    description: t('A curated database of olympiads, research programs, competitions and scholarships for high-school students, with deadlines.'),
    // App pages default to noindex; these two are public, useful content.
    robots: { index: true, follow: true },
    alternates: await pageAlternates('/discover'),
  };
}

export default function Layout({ children }) {
  return children;
}
