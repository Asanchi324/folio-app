'use client';

// Workspace → Analytics. Answers the questions a counselor actually has:
// is the cohort getting stronger, who is ready to test, are the school lists
// balanced, where are the common gaps, who went quiet — and how each
// counselor's group is doing. Computed client-side from the roster rows.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useWorkspace, cohortStats, cohortTrend, counselorLoad, rosterCsv, rowName } from '@/lib/workspace';
import { BAND_META } from '@/lib/chances';
import { useT } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { PageHead, Kpi, StatBar, EmptyCard, LockedNote } from '../ui';
import { CountUp } from '@/components/Motion';
import Sparkline from '@/components/Sparkline';

const GRADE_LABELS = { gap: 'Gap year', '—': 'Not set' };

export default function AnalyticsPage() {
  const { t, locale } = useT();
  const { rows, rowsReady, paid, staff, user, quietDays } = useWorkspace();
  const [scope, setScope] = useState('all');

  const scoped = useMemo(() => {
    if (scope === 'all') return rows;
    if (scope === 'none') return rows.filter((r) => !r.counselorUid);
    return rows.filter((r) => r.counselorUid === scope);
  }, [rows, scope]);
  const stats = cohortStats(scoped);
  const trend = useMemo(() => cohortTrend(scoped, 60), [scoped]);
  const load = counselorLoad(rows, staff, quietDays);
  const trendDelta = trend.length > 1 ? trend[trend.length - 1].v - trend[Math.max(0, trend.length - 8)].v : 0;
  const quiet = scoped
    .filter((r) => !r.updatedAt || Date.now() - r.updatedAt > quietDays * 864e5)
    .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0))
    .slice(0, 6);
  const listTotal = Object.values(stats.listBands).reduce((a, b) => a + b, 0);
  const fmt = (k) => new Date(`${k}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  function exportCsv() {
    const blob = new Blob([rosterCsv(scoped, staff)], { type: 'text/csv' });
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {staff.length > 1 && (
              <select value={scope} onChange={(e) => setScope(e.target.value)} style={{ width: 'auto' }} aria-label={t('Group')}>
                <option value="all">{t('Whole cohort')}</option>
                {staff.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.uid === user?.uid ? t('My students') : m.displayName || m.email}
                  </option>
                ))}
                <option value="none">{t('Unassigned')}</option>
              </select>
            )}
            {paid && (
              <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!scoped.length}>
                {t('Export CSV')}
              </button>
            )}
          </div>
        }
      />

      {!rowsReady ? (
        <p className="muted">{t('Loading portfolios…')}</p>
      ) : (
        <>
          <div className="an-kpis stagger">
            <Kpi label={t('Students')} value={<CountUp value={stats.n} />} hint={t('{n} active this week', { n: stats.active7 })} />
            <Kpi
              label={t('Avg strength')}
              value={<CountUp value={stats.avgStrength} />}
              hint={trend.length > 1 ? t('{d} in 7 days', { d: trendDelta > 0 ? `+${trendDelta}` : trendDelta }) : t('out of 100')}
              tone="var(--primary)"
            />
            <Kpi
              label={t('Test-ready')}
              value={<CountUp value={stats.n - stats.satBuckets.none} />}
              hint={t('have an SAT/ACT score')}
              tone="var(--good)"
            />
            <Kpi
              label={t('Unbalanced lists')}
              value={<CountUp value={stats.onlyReach + stats.noList} />}
              hint={t('no list, or reaches only')}
              tone={stats.onlyReach + stats.noList ? 'var(--warn)' : 'var(--good)'}
            />
          </div>

          <section className="card card-pad" style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 17 }}>{t('Cohort strength, last 60 days')}</h2>
              {trend.length > 1 && (
                <span style={{ fontSize: 13.5, fontWeight: 600, color: trendDelta > 0 ? 'var(--good)' : trendDelta < 0 ? 'var(--bad)' : 'var(--muted)' }}>
                  {trendDelta > 0 ? `+${trendDelta}` : trendDelta} {t('this week')}
                </span>
              )}
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
              {t('Average profile strength of the group, day by day. Growth here means the work is landing.')}
            </p>
            <Sparkline
              points={trend.map((x) => x.v)}
              height={120}
              labels={trend.length > 1 ? [fmt(trend[0].key), fmt(trend[trend.length - 1].key)] : null}
            />
          </section>

          <div className="an-grid" style={{ marginTop: 18 }}>
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
              <h2 style={{ fontSize: 17 }}>{t('Testing readiness')}</h2>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{t('Best SAT, or ACT converted to SAT.')}</p>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                <StatBar label="1450+" count={stats.satBuckets.s1450} total={stats.n} color="var(--good)" />
                <StatBar label="1350–1449" count={stats.satBuckets.s1350} total={stats.n} color="var(--primary)" />
                <StatBar label="1200–1349" count={stats.satBuckets.s1200} total={stats.n} color="var(--warn)" />
                <StatBar label={t('Below 1200')} count={stats.satBuckets.lt1200} total={stats.n} color="var(--bad)" />
                <StatBar label={t('No score yet')} count={stats.satBuckets.none} total={stats.n} color="var(--line-strong)" />
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
                {t('English: {ready} ready (IELTS 6.5+ / TOEFL 90+), {missing} without a score.', { ready: stats.englishReady, missing: stats.englishMissing })}
              </p>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>{t('School lists')}</h2>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                {t('Every school on every list, by the student’s estimated chance.')}
              </p>
              {listTotal ? (
                <>
                  <div className="an-stack" aria-hidden>
                    {['safety', 'target', 'reach', 'hard-reach'].map((b) =>
                      stats.listBands[b] ? (
                        <span key={b} style={{ flex: stats.listBands[b], background: BAND_META[b].color }} title={t(BAND_META[b].label)} />
                      ) : null
                    )}
                  </div>
                  <div className="an-legend">
                    {['safety', 'target', 'reach', 'hard-reach'].map((b) => (
                      <span key={b}>
                        <i style={{ background: BAND_META[b].color }} />
                        {t(BAND_META[b].label)} · {stats.listBands[b]}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="muted" style={{ fontSize: 13.5, marginTop: 14 }}>{t('No student has saved a school yet.')}</p>
              )}
              <p style={{ fontSize: 13.5, marginTop: 14, lineHeight: 1.5 }}>
                {stats.onlyReach > 0 && (
                  <span style={{ color: 'var(--warn)', fontWeight: 600 }}>{t('{n} with reaches only — add a target or a safety.', { n: stats.onlyReach })} </span>
                )}
                {stats.noList > 0 && <span className="muted">{t('{n} have no list yet.', { n: stats.noList })}</span>}
              </p>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>{t('Most popular schools')}</h2>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {stats.topSchools.map((s) => (
                  <StatBar key={s.id} label={s.rank ? `#${s.rank} ${s.name}` : s.name} count={s.n} total={stats.n} color="var(--primary)" />
                ))}
                {!stats.topSchools.length && <p className="muted" style={{ fontSize: 13.5 }}>{t('No student has saved a school yet.')}</p>}
              </div>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>{t('Most common gaps')}</h2>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{t('What to run a group session on.')}</p>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {stats.flagCounts.slice(0, 6).map(([label, count]) => (
                  <StatBar key={label} label={t(label)} count={count} total={stats.n} color="var(--warn)" />
                ))}
                {!stats.flagCounts.length && <p className="muted" style={{ fontSize: 13.5 }}>{t('No gaps flagged.')}</p>}
              </div>
            </section>

            <section className="card card-pad">
              <h2 style={{ fontSize: 17 }}>{t('Gone quiet')}</h2>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                {t('No portfolio update in {n}+ days — the students to message this week.', { n: quietDays })}
              </p>
              <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
                {quiet.map((r) => (
                  <Link key={r.uid} href={`/counselor/student/${r.uid}`} className="an-quiet">
                    <span style={{ fontWeight: 600 }}>{rowName(r)}</span>
                    <span className="muted" style={{ fontSize: 12.5 }}>
                      {r.updatedAt ? t('{n} days', { n: Math.floor((Date.now() - r.updatedAt) / 864e5) }) : t('never updated')}
                    </span>
                  </Link>
                ))}
                {!quiet.length && <p style={{ fontSize: 13.5, color: 'var(--good)', fontWeight: 600 }}>{t('Everyone has been active in the last {n} days.', { n: quietDays })}</p>}
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
                {t('{n} students are on a daily streak right now.', { n: stats.streaking })}
              </p>
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

            {staff.length > 1 && scope === 'all' && (
              <section className="card card-pad">
                <h2 style={{ fontSize: 17 }}>{t('By counselor')}</h2>
                <div className="an-table" role="table">
                  <div className="an-tr an-th" role="row">
                    <span>{t('Counselor')}</span>
                    <span>{t('Students')}</span>
                    <span>{t('Avg')}</span>
                    <span>{t('Attention')}</span>
                  </div>
                  {[...load.counselors, load.unassigned].filter((c) => c.n || c.member).map((c) => (
                    <div key={c.uid || 'none'} className="an-tr" role="row">
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.member ? c.member.displayName || c.member.email : t('Unassigned')}
                      </span>
                      <span>{c.n}</span>
                      <span>{c.avgStrength ?? '—'}</span>
                      <span style={{ color: c.attention ? 'var(--warn)' : undefined }}>{c.attention}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
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
        .an-grid{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:18px; align-items:start;}
        .an-stack{display:flex; height:14px; border-radius:999px; overflow:hidden; margin-top:16px; gap:2px; background:var(--line);}
        .an-stack span{transform-origin:left; animation:grow 1s var(--ease) both;}
        @keyframes grow{from{transform:scaleX(0);} to{transform:scaleX(1);}}
        .an-legend{display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:12px; font-size:12.5px; color:var(--muted);}
        .an-legend i{display:inline-block; width:9px; height:9px; border-radius:3px; margin-right:6px;}
        .an-quiet{display:flex; justify-content:space-between; gap:10px; padding:8px 10px; border:1px solid var(--line); border-radius:var(--r-sm); font-size:13.5px;}
        .an-quiet:hover{border-color:var(--line-strong);}
        .an-table{display:grid; margin-top:12px; font-size:13.5px;}
        .an-tr{display:grid; grid-template-columns:minmax(0,1fr) 64px 48px 70px; gap:10px; padding:9px 0; border-bottom:1px solid var(--line); align-items:center;}
        .an-tr > span:not(:first-child){text-align:right; font-variant-numeric:tabular-nums;}
        .an-th{font-size:12px; color:var(--muted); font-weight:600;}
        @media (max-width:1060px){.an-kpis{grid-template-columns:repeat(2, minmax(0,1fr));}}
        @media (max-width:860px){.an-grid{grid-template-columns:minmax(0,1fr);}}
      `}</style>
    </>
  );
}
