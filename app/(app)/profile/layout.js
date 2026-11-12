import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('My profile'),
    description: t('Your profile the way universities, counselors and other students see it — scores, target universities and links.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
