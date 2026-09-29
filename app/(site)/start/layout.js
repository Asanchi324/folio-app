import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Get started'),
    description: t('Answer a few questions and Folio sets up your admissions portfolio — or creates a workspace for your school.'),
    alternates: { canonical: '/start' },
  };
}

export default function Layout({ children }) {
  return children;
}
