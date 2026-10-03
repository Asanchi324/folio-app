'use client';

import { usePortfolio } from '@/lib/store';
import { useT } from '@/lib/i18n';
import CounselorChat from '@/components/CounselorChat';
import { PageHead, Loading } from '@/components/ui';

export default function AdvisorPage() {
  const { t } = useT();
  const [p, , ready] = usePortfolio();
  if (!ready) return <Loading />;
  return (
    <div className="page page-narrow">
      <PageHead
        title={t('AI counselor')}
        sub={t('Admissions, essays, ideas and plans — in your language. Pro gives you the full conversation; free accounts get 3 messages a day.')}
      />
      <CounselorChat portfolio={p} />
    </div>
  );
}
