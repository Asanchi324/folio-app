import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Assessment'),
    description: t('Your profile strength, a tier for every activity, and an honest AI review with next steps.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
