import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Join a workspace'),
    description: t('Connect your Folio portfolio to your school or counselor.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
