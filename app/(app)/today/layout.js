import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Today'),
    description: t('Your daily plan: three small steps picked from your profile’s weakest spots, and your streak.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
