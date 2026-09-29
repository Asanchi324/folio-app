import { getT } from '@/lib/i18n-server';
import WorkspaceShell from './WorkspaceShell';

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t('Workspace'),
    description: t('Follow your students’ portfolios, progress and deadlines.'),
    robots: { index: false, follow: false },
  };
}

export default function BusinessLayout({ children }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
