import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Essay coach'),
    description: t('Write your personal statement and get structured feedback: structure, show-don’t-tell and line edits.'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }) {
  return children;
}
