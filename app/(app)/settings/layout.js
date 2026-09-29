import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Settings'),
    description: t('Language, account, plan and privacy settings.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
