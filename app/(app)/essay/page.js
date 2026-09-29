'use client';

import { usePortfolio } from '@/lib/store';
import { useT } from '@/lib/i18n';
import EssayCoach from '@/components/EssayCoach';
import { PageHead, Loading } from '@/components/ui';

export default function EssayPage() {
  const { t } = useT();
  const [p, update, ready] = usePortfolio();
  if (!ready) return <Loading />;
  const n = p.narrative || {};
  const words = String(n.personalStatement || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="page">
      <PageHead
        title={t('Essay coach')}
        sub={t('Write your personal statement here — it is the same draft as in your portfolio. Common App allows up to 650 words.')}
      />
      <div className="essay-grid">
        <section className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <h2 style={{ fontSize: 19 }}>{t('Personal statement')}</h2>
            <span className="muted" style={{ fontSize: 13, color: words > 650 ? 'var(--bad)' : undefined }}>
              {t('{n} / 650 words', { n: words })}
            </span>
          </div>
          <textarea
            value={n.personalStatement || ''}
            onChange={(e) => update({ narrative: { ...n, personalStatement: e.target.value } })}
            placeholder={t('Draft or outline your main essay. Rough is fine.')}
            maxLength={9000}
            style={{ marginTop: 14, minHeight: 'min(560px, 60vh)', fontSize: 16, lineHeight: 1.65 }}
            aria-label={t('Personal statement')}
          />
        </section>
        <EssayCoach essay={n.personalStatement || ''} />
      </div>
      <style>{`
        .essay-grid{display:grid; grid-template-columns:minmax(0,1.25fr) minmax(0,1fr); gap:18px; align-items:start;}
        @media (max-width:1100px){ .essay-grid{grid-template-columns:minmax(0,1fr);} }
      `}</style>
    </div>
  );
}
