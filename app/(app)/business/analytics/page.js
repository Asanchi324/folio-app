'use client';

// Workspace → Analytics. Cohort-level distributions a counselor can drop
// straight into a parents' evening or a board slide: strength bands, common
// gaps, grade mix, engagement. Computed client-side from the same rows the
// roster uses — no extra reads.

import { useWorkspace, cohortStats, rosterCsv } from '@/lib/workspace';
import { PageHead, Kpi, StatBar, EmptyCard, LockedNote } from '../ui';
import { track } from '@/lib/analytics';

const GRADE_LABELS = { gap: 'Gap year', '—': 'Not set' };
const FLAG_TEXT = { 'No GPA': 'No GPA', 'No SAT/ACT': 'No SAT/ACT', 'No IELTS/TOEFL': 'No IELTS/TOEFL', 'No essay draft': 'No essay draft', 'No activities': 'No activities', 'Membership, not leadership': 'Membership, not leadership', 'No honors': 'No honors', 'No intended major': 'No intended major' };

export default function AnalyticsPage() {
  const { t } = useT();
  const { rows, rowsReady, paid } = useWorkspace();
  const stats = cohortStats(rows);

  function exportCsv() {
    const blob = new Blob([rosterCsv(rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `folio-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    track('cohort_csv_export', { from: 'analytics' });
  }

  if (rowsReady && !rows.length) {
    return (
      <>
        <PageHead title={t('Analytics')} sub={t('Cohort-level insight appears once students connect.')} />
        <EmptyCard
          icon="chart"
          title={t('No data yet')}
          body={t('Add students from the Students tab — distributions, gaps and engagement build themselves from their live portfolios.')}
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title={t('Analytics')}
        sub={t('Live cohort picture — every number recomputes from students’ current portfolios.')}
        right={
          paid ? (
            <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>
              {t('Export CSV')}
            </button>
          ) : null
        }
      />

      {!rowsReady ? (
        <p className="muted">{t('Loading portfolios…')}</p>
      ) : (
        <>
          <div className="an-kpis">
            <Kpi label={t('Cohort')} value={stats.n} hint={t('connected students')} />
            <Kpi label={t('Avg strength')} value={stats.avgStrength} hint={t('out of 100')} tone="var(--primary)" />
            <Kpi label={t('Active · 7 days')} value={stats.active7} hint={t('{n} in 30 days', { n: stats.active30 })} tone="var(--good)" />
            <Kpi label={t('Critical gaps')} value={stats.needsAttention} hint={t('students flagged')} tone={stats.needsAttention ? 'var(--warn)' : 'var(--good)'} />
          </div>

          <div className="an-grid" style={{ marginTop: 24 }}>
            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>{t('Profile strength distribution')}</h2>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <StatBar label={t('Strong (75+)')} count={stats.bands.strong} total={stats.n} color="var(--good)" />
                <StatBar label={t('Solid (50–74)')} count={stats.bands.solid} total={stats.n} color="var(--primary)" />
                <StatBar label={t('Developing (30–49)')} count={stats.bands.developing} total={stats.n} color="var(--warn)" />
                <StatBar label={t('Early (<30)')} count={stats.bands.weak} total={stats.n} color="var(--bad)" />
              </div>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>{t('Most common gaps')}</h2>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                {t('What to run a group session on.')}
              </p>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {stats.flagCounts.slice(0, 6).map(([label, count]) => (
                  <StatBar key={label} label={t(FLAG_TEXT[label] || label)} count={count} total={stats.n} color="var(--warn)" />
                ))}
                {!stats.flagCounts.length && (
                  <p className="muted" style={{ fontSize: 13.5 }}>{t('No gaps flagged.')}</p>
                )}
              </div>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>{t('Grade mix')}</h2>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {Object.entries(stats.grades)
                  .sort(([a], [b]) => String(a).localeCompare(String(b)))
                  .map(([grade, count]) => (
                    <StatBar key={grade} label={GRADE_LABELS[grade] ? t(GRADE_LABELS[grade]) : t('Grade {n}', { n: grade })} count={count} total={stats.n} color="var(--primary)" />
                  ))}
              </div>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>{t('Engagement')}</h2>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                {t('Students who updated their portfolio recently.')}
              </p>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                <StatBar label={t('Last 7 days')} count={stats.active7} total={stats.n} color="var(--good)" />
                <StatBar label={t('Last 30 days')} count={stats.active30} total={stats.n} color="var(--primary)" />
                <StatBar label={t('Inactive')} count={stats.n - stats.active30} total={stats.n} color="var(--line-strong)" />
              </div>
              {stats.n - stats.active30 > 0 && (
                <p className="muted" style={{ fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
                  {t('Inactive students are the ones to message — a portfolio that is not growing usually means an application that is not either.')}
                </p>
              )}
            </section>
          </div>

          {!paid && (
            <div style={{ marginTop: 18 }}>
              <LockedNote>{t('CSV export is included in paid plans.')}</LockedNote>
            </div>
          )}
        </>
      )}

      <style>{`
        .an-kpis{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:14px;}
        .an-grid{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:18px;}
        @media (max-width:1060px){.an-kpis{grid-template-columns:repeat(2, minmax(0,1fr));}}
        @media (max-width:860px){.an-grid{grid-template-columns:minmax(0,1fr);}}
      `}</style>
    </>
  );
}
