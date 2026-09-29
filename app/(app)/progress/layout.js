import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Progress'),
    description: t('How your profile has grown, and how it compares with a strong admit at the schools you are aiming for.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
