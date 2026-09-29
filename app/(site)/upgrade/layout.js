import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Plans and pricing'),
    description: t('Folio is free for students. Pro adds the AI essay coach and counselor; workspace plans are for schools and counselors.'),
    alternates: { canonical: '/upgrade' },
  };
}

export default function Layout({ children }) {
  return children;
}
