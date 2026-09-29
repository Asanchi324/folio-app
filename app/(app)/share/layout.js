import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Share & PDF'),
    description: t('A public link to your portfolio and a printable PDF.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
