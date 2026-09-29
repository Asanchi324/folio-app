import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Portfolio'),
    description: t('Build your Common App–style portfolio: academics, tests, activities, honors and your personal statement.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
