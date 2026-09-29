import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Deadlines'),
    description: t('Application rounds and program deadlines in one countdown.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
