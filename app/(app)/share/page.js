'use client';

import { usePortfolio } from '@/lib/store';
import { useT } from '@/lib/i18n';
import ShareCard from '@/components/ShareCard';
import { PageHead, Loading } from '@/components/ui';

export default function SharePage() {
  const { t } = useT();
  const [p, , ready, meta] = usePortfolio();
  if (!ready) return <Loading />;
  return (
    <div className="page page-narrow">
      <PageHead title={t('Share & PDF')} sub={t('A read-only public page you control, and a printable summary.')} />
      <ShareCard p={p} meta={meta} />
    </div>
  );
}
