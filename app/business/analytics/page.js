'use client';

// Workspace → Analytics. Cohort-level distributions a counselor can drop
// straight into a parents' evening or a board slide: strength bands, common
// gaps, grade mix, engagement. Computed client-side from the same rows the
// roster uses — no extra reads.

import { useWorkspace, cohortStats, rosterCsv } from '@/lib/workspace';
import { PageHead, Kpi, StatBar, EmptyCard, LockedNote } from '../ui';
import { track } from '@/lib/analytics';

const GRADE_LABELS = { 9: 'Grade 9', 10: 'Grade 10', 11: 'Grade 11', 12: 'Grade 12', gap: 'Gap year', '—': 'Not set' };

export default function AnalyticsPage() {
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
        <PageHead title="Analytics" sub="Cohort-level insight appears once students connect." />
        <EmptyCard
          icon="▤"
          title="No data yet"
          body="Invite students from the Students tab — distributions, gaps and engagement build themselves from their live portfolios."
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Analytics"
        sub="Live cohort picture — every number recomputes from students' current portfolios."
        right={
          paid ? (
            <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>
              ⬇ Export CSV
            </button>
          ) : null
        }
      />

      {!rowsReady ? (
        <p className="muted">Crunching portfolios…</p>
      ) : (
        <>
          <div className="an-kpis">
            <Kpi label="Cohort" value={stats.n} hint="connected students" />
            <Kpi label="Avg strength" value={stats.avgStrength} hint="out of 100" tone="var(--primary)" />
            <Kpi label="Active · 7 days" value={stats.active7} hint={`${stats.active30} in 30 days`} tone="var(--good)" />
            <Kpi label="Critical gaps" value={stats.needsAttention} hint="students flagged" tone={stats.needsAttention ? 'var(--warn)' : 'var(--good)'} />
          </div>

          <div className="an-grid" style={{ marginTop: 24 }}>
            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>Profile strength distribution</h2>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <StatBar label="Strong (75+)" count={stats.bands.strong} total={stats.n} color="var(--good)" />
                <StatBar label="Solid (50–74)" count={stats.bands.solid} total={stats.n} color="var(--primary)" />
                <StatBar label="Developing (30–49)" count={stats.bands.developing} total={stats.n} color="var(--warn)" />
                <StatBar label="Early (<30)" count={stats.bands.weak} total={stats.n} color="var(--bad)" />
              </div>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>Most common gaps</h2>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                What to run a group session on.
              </p>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {stats.flagCounts.slice(0, 6).map(([label, count]) => (
                  <StatBar key={label} label={label} count={count} total={stats.n} color="var(--warn)" />
                ))}
                {!stats.flagCounts.length && (
                  <p className="muted" style={{ fontSize: 13.5 }}>No gaps flagged — a rare and beautiful sight.</p>
                )}
              </div>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>Grade mix</h2>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {Object.entries(stats.grades)
                  .sort(([a], [b]) => String(a).localeCompare(String(b)))
                  .map(([grade, count]) => (
                    <StatBar key={grade} label={GRADE_LABELS[grade] || `Grade ${grade}`} count={count} total={stats.n} color="var(--primary)" />
                  ))}
              </div>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>Engagement</h2>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                Students who touched their portfolio recently.
              </p>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                <StatBar label="Last 7 days" count={stats.active7} total={stats.n} color="var(--good)" />
                <StatBar label="Last 30 days" count={stats.active30} total={stats.n} color="var(--primary)" />
                <StatBar label="Dormant" count={stats.n - stats.active30} total={stats.n} color="var(--line-strong)" />
              </div>
              {stats.n - stats.active30 > 0 && (
                <p className="muted" style={{ fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
                  Dormant students are the ones to ping — a portfolio that isn't
                  growing usually means an application that isn't either.
                </p>
              )}
            </section>
          </div>

          {!paid && (
            <div style={{ marginTop: 18 }}>
              <LockedNote>CSV export of this data is included in Business.</LockedNote>
            </div>
          )}
        </>
      )}

      <style>{`
        .an-kpis{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:14px;}
        .an-grid{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:18px;}
        @media (max-width:1060px){.an-kpis{grid-template-columns:repeat(2, minmax(0,1fr));}}
        @media (max-width:860px){.an-grid{grid-template-columns:1fr;}}
      `}</style>
    </>
  );
}
