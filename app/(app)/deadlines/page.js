'use client';

import { usePortfolio } from '@/lib/store';
import { useT } from '@/lib/i18n';
import DeadlinesCard from '@/components/DeadlinesCard';
import { PageHead, Loading } from '@/components/ui';

export default function DeadlinesPage() {
  const { t } = useT();
  const [p, update, ready] = usePortfolio();
  if (!ready) return <Loading />;
  return (
    <div className="page page-narrow">
      <PageHead
        title={t('Deadlines')}
        sub={t('Application rounds for the universities on your list and the programs you track, in one countdown.')}
      />
      <DeadlinesCard p={p} update={update} />
    </div>
  );
}
