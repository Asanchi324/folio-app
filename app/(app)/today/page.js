'use client';

// Today — the daily home. Three tasks picked from this student's gaps that
// tick themselves off as the portfolio improves, the streak, and the week's
// progress at a glance.

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/lib/store';
import { profileBreakdown, strengthTier } from '@/lib/profile';
import { dayKey, recordProgress, todaysTasks, streakInfo, recentDays, strengthTrend } from '@/lib/daily';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import { Loading } from '@/components/ui';
import { CountUp } from '@/components/Motion';
import Icon from '@/components/Icon';
import Sparkline from '@/components/Sparkline';

export default function TodayPage() {
  const { t, locale } = useT();
  const router = useRouter();
  const [p, update, ready, , synced] = usePortfolio();
  const key = dayKey();
  const breakdown = useMemo(() => profileBreakdown(p), [p]);

  useEffect(() => {
    if (ready && synced && !p.onboarded && !p.fullName) router.replace('/start');
  }, [ready, synced, p.onboarded, p.fullName, router]);

  // Start the day / record completed tasks + today's strength point.
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
    track('today_view');
  }, []);

  if (!ready) return <Loading />;

  const tasks = todaysTasks(p, key);
  const doneCount = tasks.filter((x) => x.done).length;
  const info = streakInfo(p, key);
  const days = recentDays(p, key, 14);
  const trend = strengthTrend(p, key, 30);
  const rawDate = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1); // capitalise the weekday only
  const firstName = (p.fullName || '').split(' ')[0];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="muted" style={{ fontSize: 14 }}>{date}</p>
          <h1 style={{ marginTop: 4 }}>{firstName ? t('Hi, {name}', { name: firstName }) : t('Today')}</h1>
        </div>
      </div>

      <div className="td-grid">
        <section className="card card-pad td-tasks">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ fontSize: 20 }}>{t('Today’s plan')}</h2>
            <span className="muted" style={{ fontSize: 13.5 }}>{t('{done} of {total} done', { done: doneCount, total: tasks.length })}</span>
          </div>
          <div className="bar" style={{ marginTop: 12 }}>
            <span style={{ width: `${(doneCount / Math.max(1, tasks.length)) * 100}%`, background: 'var(--good)' }} />
          </div>
          <ul className="td-list stagger">
            {tasks.map((task) => (
              <li key={task.id} className={task.done ? 'done' : ''}>
                <span className="td-check" aria-hidden>
                  {task.done && <Icon name="check" size={14} strokeWidth={2.6} className="pop" />}
                </span>
                <span className="td-text">{t(task.text, task.vars)}</span>
                {!task.done && (
                  <Link href={task.href} className="btn btn-ghost btn-sm">
                    {t('Do it')}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className="muted" style={{ fontSize: 13, marginTop: 14, lineHeight: 1.5 }}>
            {doneCount === tasks.length
              ? t('All done for today. New tasks appear tomorrow.')
              : t('Tasks tick themselves off as you update your portfolio. Picked from your weakest spots.')}
          </p>
        </section>

        <section className="card card-pad td-streak">
          <div className="td-flame">
            <span className={`td-num${info.todayActive ? ' on' : ''}`}>
              <CountUp value={info.streak} />
            </span>
            <div>
              <b>{t('Day streak')}</b>
              <p className="muted">
                {info.todayActive
                  ? t('Today counts. Come back tomorrow to keep it going.')
                  : info.streak
                    ? t('Finish one task today to keep your streak.')
                    : t('Finish one task to start a streak.')}
              </p>
            </div>
          </div>
          <div className="td-days" aria-label={t('Last 14 days')}>
            {days.map((d) => (
              <span key={d.key} className={`td-day${d.active ? ' on' : ''}${d.today ? ' today' : ''}`} title={d.key} />
            ))}
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('Best: {n}', { n: info.best })}</span>
            <span>{t('Tasks done: {n}', { n: info.tasksDone })}</span>
          </div>
        </section>

        <section className="card card-pad td-trend">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ fontSize: 19 }}>{t('Profile strength')}</h2>
            <span style={{ fontFamily: 'var(--display)', fontSize: 26 }}>
              <CountUp value={breakdown.strength} />
            </span>
          </div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>
            {t(strengthTier(breakdown.strength))}
            {trend.points.length > 1 && (
              <span style={{ color: trend.delta > 0 ? 'var(--good)' : trend.delta < 0 ? 'var(--bad)' : undefined, marginLeft: 8, fontWeight: 600 }}>
                {trend.delta > 0 ? `+${trend.delta}` : trend.delta} {t('this week')}
              </span>
            )}
          </p>
          <Sparkline points={trend.points.map((x) => x.v)} height={64} />
          <Link href="/progress" className="link" style={{ fontSize: 14, marginTop: 10, display: 'inline-block' }}>
            {t('Progress and ideal portfolio')} →
          </Link>
        </section>
      </div>

      <style>{`
        .td-grid{display:grid; grid-template-columns:minmax(0,1.5fr) minmax(0,1fr); gap:18px; align-items:start;}
        .td-tasks{grid-row:span 2;}
        .td-list{list-style:none; margin:16px 0 0; padding:0; display:grid; gap:8px;}
        .td-list li{display:flex; align-items:center; gap:12px; padding:12px 14px; border:1px solid var(--line);
          border-radius:var(--r); background:var(--surface-2); transition:background .35s var(--ease), border-color .35s var(--ease);}
        .td-list li.done{background:var(--good-tint); border-color:#cde7da;}
        .td-list li.done .td-text{color:var(--muted); text-decoration:line-through; text-decoration-color:rgba(0,0,0,.25);}
        .td-check{width:22px; height:22px; border-radius:7px; border:1.5px solid var(--line-strong); flex-shrink:0;
          display:flex; align-items:center; justify-content:center; color:#fff; transition:background .3s var(--ease), border-color .3s var(--ease);}
        .td-list li.done .td-check{background:var(--good); border-color:var(--good);}
        .td-text{flex:1; min-width:0; font-size:14.5px; line-height:1.45;}
        .td-flame{display:flex; gap:14px; align-items:center;}
        .td-flame b{font-size:15px;}
        .td-flame p{font-size:13px; line-height:1.45; margin-top:2px;}
        .td-num{font-family:var(--display); font-size:34px; min-width:58px; height:58px; border-radius:14px;
          display:flex; align-items:center; justify-content:center; background:var(--surface-2); border:1px solid var(--line);
          transition:background .4s var(--ease), color .4s var(--ease);}
        .td-num.on{background:var(--ink); color:#fff; border-color:var(--ink);}
        .td-days{display:grid; grid-template-columns:repeat(14,1fr); gap:5px; margin-top:16px;}
        .td-day{aspect-ratio:1; border-radius:5px; background:var(--line); transition:background .3s var(--ease);}
        .td-day.on{background:var(--good);}
        .td-day.today{box-shadow:0 0 0 2px var(--surface), 0 0 0 3.5px var(--ink-2);}
        @media (max-width:900px){ .td-grid{grid-template-columns:minmax(0,1fr);} .td-tasks{grid-row:auto;} }
        @media (max-width:480px){ .td-list li{flex-wrap:wrap;} .td-list .btn{margin-left:34px;} }
      `}</style>
    </div>
  );
}
