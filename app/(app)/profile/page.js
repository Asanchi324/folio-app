'use client';

// My profile — the student's portfolio as others see it (LinkedIn-style),
// with pencils that jump to the builder, inline ranking of target
// universities, and "Students like you" on the side.

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/lib/store';
import { useEffectivePlan } from '@/lib/account';
import { shareExtras, useLiveShare } from '@/lib/share';
import { resolveTargets } from '@/lib/targets';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import PortfolioView from '@/components/PortfolioView';
import PeersCard from '@/components/PeersCard';
import Icon from '@/components/Icon';
import { PageHead, Loading } from '@/components/ui';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useT();
  const [p, update, ready, meta, synced] = usePortfolio();
  const { user, plan, org } = useEffectivePlan();
  const extras = useMemo(() => shareExtras(plan, org), [plan, org]);

  // First-time visitors go through onboarding first (same rule as /portfolio).
  useEffect(() => {
    if (ready && synced && !p.onboarded && !p.fullName) router.replace('/start');
  }, [ready, synced, p.onboarded, p.fullName, router]);

  useEffect(() => {
    track('profile_view');
  }, []);

  // A live public link follows every edit made here (targets, top choice).
  useLiveShare({ user, p, meta, extras, enabled: synced });

  const targets = useMemo(() => resolveTargets(p), [p]);

  if (!ready) return <Loading />;

  const shareId = meta?.shareId;

  return (
    <div className="page">
      <PageHead
        title={t('My profile')}
        sub={t('How universities, counselors and other students see you. Tap a pencil to edit.')}
        right={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {shareId ? (
              <a href={`/p/${shareId}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <Icon name="external" size={15} /> {t('Public page')}
              </a>
            ) : null}
            <Link href="/share" className="btn btn-primary btn-sm">
              <Icon name="share" size={15} /> {shareId ? t('Share settings') : t('Share profile')}
            </Link>
          </div>
        }
      />

      <div className="me-grid">
        <PortfolioView
          p={p}
          targets={targets}
          editable
          options={{ narrative: false }}
          onTargetsChange={({ shortlist, topChoice }) => {
            update({ shortlist, topChoice });
            track('targets_edit');
          }}
        />
        <aside className="me-side">
          <PeersCard p={p} meta={meta} user={user} extras={extras} synced={synced} />
        </aside>
      </div>

      <style>{`
        .me-grid{display:grid; grid-template-columns:minmax(0, 1fr) 340px; gap:18px; align-items:start;}
        .me-side{position:sticky; top:24px; display:grid; gap:16px; animation:rise .55s var(--ease) both .15s;}
        @media (max-width:1100px){ .me-grid{grid-template-columns:minmax(0, 1fr);} .me-side{position:static;} }
      `}</style>
    </div>
  );
}
