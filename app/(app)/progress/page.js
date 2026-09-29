'use client';

// Progress + ideal portfolio. Left: how the profile has grown (strength over
// time, change per pillar, streak). Right: a data-derived benchmark for the
// chosen tier of schools, compared line by line with the student's profile.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/store';
import { profileBreakdown } from '@/lib/profile';
import { dayKey, recordProgress, strengthTrend, pillarChange, streakInfo } from '@/lib/daily';
import { TIERS, benchmark, suggestedTier, compareToBenchmark } from '@/lib/benchmarks';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import { PageHead, Loading } from '@/components/ui';
import { CountUp } from '@/components/Motion';
import Sparkline from '@/components/Sparkline';
import Icon from '@/components/Icon';

export default function ProgressPage() {
  const { t, locale } = useT();
  const [p, update, ready, , synced] = usePortfolio();
  const key = dayKey();
  const breakdown = useMemo(() => profileBreakdown(p), [p]);
  const [tier, setTier] = useState(null);

  useEffect(() => {
    if (!ready || !synced) return;
    const next = recordProgress(p, key, breakdown);
    if (next) {
      update((prev) => ({ ...prev, daily: next }));
      // Let the sidebar badge refresh once the save has hit localStorage.
      setTimeout(() => window.dispatchEvent(new Event('folio:daily')), 50);
    }
  }, [ready, synced, p, key, breakdown, update]);

  useEffect(() => {
    track('progress_view');
  }, []);

  if (!ready) return <Loading />;

  const tierId = tier || p.targetTier || suggestedTier(p);
  const b = benchmark(tierId);
  const cmp = compareToBenchmark(p, b);
  const trend = strengthTrend(p, key, 60);
  const change = pillarChange(p);
  const info = streakInfo(p, key);
  const fmt = (k) => new Date(`${k}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  function chooseTier(id) {
    setTier(id);
    update({ targetTier: id });
    track('benchmark_tier', { tier: id });
  }

  return (
    <div className="page">
      <PageHead
        title={t('Progress')}
        sub={t('How your profile has grown, and how it compares with a strong admit at the schools you are aiming for.')}
      />

      <div className="pg-grid">
        {/* ---------- progress ---------- */}
        <div className="stagger" style={{ display: 'grid', gap: 18, minWidth: 0 }}>
          <section className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <h2 style={{ fontSize: 19 }}>{t('Profile strength over time')}</h2>
              <span style={{ fontFamily: 'var(--display)', fontSize: 28 }}>
                <CountUp value={breakdown.strength} />
              </span>
            </div>
            {trend.points.length > 1 && (
              <p style={{ fontSize: 13.5, marginTop: 2, fontWeight: 600, color: trend.delta > 0 ? 'var(--good)' : trend.delta < 0 ? 'var(--bad)' : 'var(--muted)' }}>
                {trend.delta > 0 ? `+${trend.delta}` : trend.delta} {t('this week')}
              </p>
            )}
            <Sparkline
              points={trend.points.map((x) => x.v)}
              height={110}
              labels={trend.points.length > 1 ? [fmt(trend.points[0].key), fmt(trend.points[trend.points.length - 1].key)] : null}
            />
          </section>

          <section className="card card-pad">
            <h2 style={{ fontSize: 19 }}>{t('By pillar')}</h2>
            {change && (
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{t('Change since {date}', { date: fmt(change.since) })}</p>
            )}
            <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
              {breakdown.pillars.map((pl, i) => {
                const d = change?.diff[i] || 0;
                return (
                  <div key={pl.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ fontWeight: 600 }}>{t(pl.label)}</span>
                      <span>
                        {pl.score}
                        {d !== 0 && (
                          <b style={{ marginLeft: 8, fontSize: 12.5, color: d > 0 ? 'var(--good)' : 'var(--bad)' }}>
                            {d > 0 ? `+${d}` : d}
                          </b>
                        )}
                      </span>
                    </div>
                    <div className="bar" style={{ marginTop: 5 }}>
                      <span style={{ width: `${pl.score}%`, background: 'var(--ink-2)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card card-pad pg-stats">
            <div>
              <b><CountUp value={info.streak} /></b>
              <span className="muted">{t('Day streak')}</span>
            </div>
            <div>
              <b><CountUp value={info.best} /></b>
              <span className="muted">{t('Best streak')}</span>
            </div>
            <div>
              <b><CountUp value={info.tasksDone} /></b>
              <span className="muted">{t('Tasks done')}</span>
            </div>
          </section>
        </div>

        {/* ---------- ideal portfolio ---------- */}
        <section className="card card-pad" style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 20 }}>{t('Ideal portfolio')}</h2>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>
            {t('What a strong admit looks like for this group of schools — built from their real admission data ({n} schools), not from one person.', { n: b.schools })}
          </p>
          <select value={tierId} onChange={(e) => chooseTier(e.target.value)} style={{ marginTop: 14 }} aria-label={t('Target schools')}>
            {TIERS.map((x) => (
              <option key={x.id} value={x.id}>{t(x.label)}</option>
            ))}
          </select>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            {t('For example: {names}', { names: b.sampleNames.slice(0, 3).join(', ') })} · {t('median admit rate {n}%', { n: Math.round(b.rate) })}
          </p>

          <div className="pg-score">
            <span style={{ fontFamily: 'var(--display)', fontSize: 30 }}>
              <CountUp value={cmp.met} />/{cmp.checks.length}
            </span>
            <span className="muted" style={{ fontSize: 13.5 }}>{t('benchmarks met')}</span>
          </div>

          <ul className="pg-checks stagger">
            {cmp.checks.map((c) => (
              <li key={c.key} className={c.ok ? 'ok' : ''}>
                <span className="pg-mark" aria-hidden>
                  {c.ok ? <Icon name="check" size={13} strokeWidth={2.6} /> : null}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{t(c.text, c.vars)}</span>
                <span className="pg-yours">{String(c.yours)}</span>
              </li>
            ))}
          </ul>

          <div className="sub-title" style={{ marginTop: 20 }}>{t('Pillars: you vs. ideal')}</div>
          <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
            {breakdown.pillars.map((pl) => {
              const target = b.pillars[pl.key];
              const mine = cmp.pillarScores[pl.key];
              return (
                <div key={pl.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ fontWeight: 600 }}>{t(pl.label)}</span>
                    <span className="muted">
                      {mine} / {target}
                    </span>
                  </div>
                  <div className="bar pg-bar" style={{ marginTop: 5 }}>
                    <span style={{ width: `${Math.min(100, mine)}%`, background: mine >= target ? 'var(--good)' : 'var(--primary)' }} />
                    <i style={{ left: `${target}%` }} title={t('Ideal')} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 16, lineHeight: 1.5 }}>
            {t('The ideal uses the upper end of each school’s admitted range. Meeting it does not guarantee admission; missing a line is normal — it shows where effort pays off most.')}
          </p>
          <Link href="/today" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
            {t('See today’s tasks')}
          </Link>
        </section>
      </div>

      <style>{`
        .pg-grid{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:18px; align-items:start;}
        .pg-stats{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; text-align:center;}
        .pg-stats b{display:block; font-family:var(--display); font-size:28px; font-weight:400;}
        .pg-stats span{font-size:12.5px;}
        .pg-score{display:flex; align-items:baseline; gap:10px; margin-top:18px;}
        .pg-checks{list-style:none; padding:0; margin:12px 0 0; display:grid; gap:6px;}
        .pg-checks li{display:flex; align-items:center; gap:10px; font-size:14px; padding:9px 12px; border-radius:var(--r-sm); border:1px solid var(--line);}
        .pg-checks li.ok{background:var(--good-tint); border-color:#cde7da;}
        .pg-mark{width:20px; height:20px; border-radius:6px; flex-shrink:0; border:1.5px solid var(--line-strong); display:flex; align-items:center; justify-content:center; color:#fff;}
        .pg-checks li.ok .pg-mark{background:var(--good); border-color:var(--good);}
        .pg-yours{font-size:13px; color:var(--muted); font-variant-numeric:tabular-nums; white-space:nowrap;}
        .pg-bar{position:relative; overflow:visible;}
        .pg-bar > span{border-radius:999px;}
        .pg-bar i{position:absolute; top:-3px; width:2px; height:12px; background:var(--ink); border-radius:2px; transform:translateX(-1px);}
        @media (max-width:1000px){ .pg-grid{grid-template-columns:minmax(0,1fr);} }
      `}</style>
    </div>
  );
}
