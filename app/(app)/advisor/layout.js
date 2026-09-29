import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('AI counselor'),
    description: t('Ask admissions strategy questions about your own profile.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
