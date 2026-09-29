import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Sign in'),
    description: t('Sign in to Folio with Google to keep your portfolio safe and use it on any device.'),
    alternates: { canonical: '/login' },
  };
}

export default function Layout({ children }) {
  return children;
}
