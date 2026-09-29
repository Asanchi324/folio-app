'use client';

// Product visuals for the landing page. Each one is a miniature of a real
// screen (Review, Today, Universities, Progress, the school workspace), drawn
// in HTML so it stays crisp, themable and animated: numbers count up, bars
// grow and tasks tick themselves off once the visual scrolls into view.
// The people and numbers are illustrative — they're labelled as an example.

import { useEffect, useState } from 'react';
import { CountUp, useInView, prefersReducedMotion } from '@/components/Motion';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';

function useLive() {
  const [ref, inView] = useInView({ rootMargin: '0px 0px -80px 0px', threshold: 0.2 });
  return [ref, inView];
}

function MiniRing({ value, live, size = 92, stroke = 9, color = 'var(--primary)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - ((live ? value : 0) / 100) * c;
  return (
    <div className="lv-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1.6s var(--ease)' }}
        />
      </svg>
      <span>{live ? <CountUp value={value} duration={1600} /> : 0}</span>
    </div>
  );
}

function Bar({ pct, live, color, delay = 0 }) {
  return (
    <span className="lv-bar">
      <span style={{ width: live ? `${pct}%` : 0, background: color, transitionDelay: `${delay}ms` }} />
    </span>
  );
}

/* ---------------------------------------------------------------- hero */

export function HeroVisual() {
  const { t } = useT();
  const [ref, live] = useLive();
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!live) return;
    if (prefersReducedMotion()) return setDone(2);
    const a = setTimeout(() => setDone(1), 1400);
    const b = setTimeout(() => setDone(2), 2300);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [live]);

  return (
    <div ref={ref} className={`lv-hero${live ? ' live' : ''}`} aria-hidden>
      <div className="lv-glow" />

      <div className="lv-card lv-h-main">
        <div className="lv-head">
          <span>{t('Profile strength')}</span>
          <span className="lv-chip good">+12 {t('this month')}</span>
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 12 }}>
          <MiniRing value={78} live={live} size={96} />
          <div style={{ display: 'grid', gap: 9, flex: 1, minWidth: 0 }}>
            {[
              [t('Academics'), 86, 'var(--primary)'],
              [t('Testing'), 81, 'var(--primary)'],
              [t('Activities'), 74, 'var(--good)'],
              [t('Essays'), 58, 'var(--warn)'],
            ].map(([l, v, c], i) => (
              <div key={l} className="lv-pillar">
                <span>{l}</span>
                <Bar pct={v} live={live} color={c} delay={300 + i * 120} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lv-card lv-h-tasks">
        <div className="lv-head">
          <span>{t('Today’s plan')}</span>
          <span className="muted">{done}/3</span>
        </div>
        {[t('Add results to your robotics project'), t('Register for the SAT in March'), t('Draft essay paragraph 2')].map((x, i) => (
          <div key={x} className={`lv-task${done > i ? ' done' : ''}`}>
            <span className="lv-check">{done > i && <Icon name="check" size={11} strokeWidth={3} />}</span>
            <span>{x}</span>
          </div>
        ))}
      </div>

      <div className="lv-card lv-h-odds">
        <div className="lv-head">
          <span>{t('Your chances')}</span>
        </div>
        {[
          ['#4', 'Harvard', 6, 'var(--bad)'],
          ['#17', 'Univ. of Michigan', 34, 'var(--primary)'],
          ['#48', 'Univ. of Toronto', 61, 'var(--good)'],
        ].map(([rank, n, v, c], i) => (
          <div key={n} className="lv-odd">
            <b className="lv-rank">{rank}</b>
            <span className="lv-odd-name">{n}</span>
            <Bar pct={v} live={live} color={c} delay={500 + i * 150} />
            <b className="lv-pct">{live ? <CountUp value={v} duration={1400} suffix="%" /> : '0%'}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- step visuals */

export function BuildVisual() {
  const { t } = useT();
  const [ref, live] = useLive();
  const sections = [
    ['portfolio', t('Academics'), `GPA 3.9 · ${t('Grade {n}', { n: 11 })}`, true],
    ['gauge', t('Testing'), 'SAT 1480 · IELTS 7.5', true],
    ['star', t('Activities'), t('6 of 10 added'), false],
    ['target', t('Honors'), t('2 of 5 added'), false],
    ['pen', t('Essays'), t('Personal statement · draft'), false],
  ];
  return (
    <div ref={ref} className={`lv-frame${live ? ' live' : ''}`} aria-hidden>
      <div className="lv-card">
        <div className="lv-head">
          <span>{t('Your portfolio')}</span>
          <b className="lv-big">{live ? <CountUp value={72} duration={1500} suffix="%" /> : '0%'}</b>
        </div>
        <Bar pct={72} live={live} color="var(--primary)" />
        <div className="lv-sections">
          {sections.map(([icon, title, sub, ok], i) => (
            <div key={title} className="lv-sec" style={{ transitionDelay: `${200 + i * 90}ms` }}>
              <span className={`lv-sec-ic${ok ? ' ok' : ''}`}>
                <Icon name={ok ? 'check' : icon} size={14} strokeWidth={ok ? 3 : 2} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>{title}</b>
                <small>{sub}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeedbackVisual() {
  const { t } = useT();
  const [ref, live] = useLive();
  return (
    <div ref={ref} className={`lv-frame${live ? ' live' : ''}`} aria-hidden>
      <div className="lv-card">
        <div className="lv-head">
          <span>{t('Review')}</span>
          <span className="lv-chip">{t('AI + rubric')}</span>
        </div>
        {[
          [t('Founder, coding club for rural schools'), t('400 students · 3 years · national reach'), 1, 88, 'var(--good)'],
          [t('Volunteer, city library'), t('2 hrs/week · no results described'), 3, 41, 'var(--warn)'],
        ].map(([title, sub, tier, v, c], i) => (
          <div key={title} className="lv-act" style={{ transitionDelay: `${150 + i * 150}ms` }}>
            <span className="lv-tier" style={{ color: c, borderColor: c }}>T{tier}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b>{title}</b>
              <small>{sub}</small>
            </span>
            <b className="lv-score">{live ? <CountUp value={v} duration={1300} /> : 0}</b>
          </div>
        ))}
        <div className="lv-note">
          <Icon name="spark" size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }} />
          <span>
            {t('Add a result — “cut wait times by 30%” — and it becomes Tier 2.')}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PlanVisual() {
  const { t } = useT();
  const [ref, live] = useLive();
  const days = [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1];
  return (
    <div ref={ref} className={`lv-frame${live ? ' live' : ''}`} aria-hidden>
      <div className="lv-card">
        <div className="lv-head">
          <span>{t('Today’s plan')}</span>
          <span className="lv-streak">
            <b>{live ? <CountUp value={9} duration={1200} /> : 0}</b> {t('day streak')}
          </span>
        </div>
        {[t('Book an IELTS date'), t('Add a measurable result to “Debate club”'), t('Shortlist 2 target schools')].map((x, i) => (
          <div key={x} className={`lv-task${live && i < 2 ? ' done' : ''}`} style={{ transitionDelay: `${600 + i * 450}ms` }}>
            <span className="lv-check" style={{ transitionDelay: `${600 + i * 450}ms` }}>
              <Icon name="check" size={11} strokeWidth={3} />
            </span>
            <span>{x}</span>
          </div>
        ))}
        <div className="lv-days">
          {days.map((d, i) => (
            <span key={i} className={d ? 'on' : ''} style={{ transitionDelay: `${i * 45}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ApplyVisual() {
  const { t } = useT();
  const [ref, live] = useLive();
  const unis = [
    ['#3', 'Stanford University', t('Hard reach'), 5, 'var(--bad)'],
    ['#19', 'Carnegie Mellon University', t('Reach'), 18, 'var(--warn)'],
    ['#41', 'University of Toronto', t('Target'), 44, 'var(--primary)'],
    ['#88', 'Penn State University', t('Safety'), 71, 'var(--good)'],
  ];
  return (
    <div ref={ref} className={`lv-frame${live ? ' live' : ''}`} aria-hidden>
      <div className="lv-card">
        <div className="lv-tabs">
          {['All', 'Top 20', 'Top 50', 'Top 100'].map((x, i) => (
            <span key={x} className={i === 3 ? 'on' : ''}>{t(x)}</span>
          ))}
        </div>
        {unis.map(([rank, name, band, v, c], i) => (
          <div key={name} className="lv-uni" style={{ transitionDelay: `${150 + i * 110}ms` }}>
            <b className="lv-rank">{rank}</b>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b>{name}</b>
              <small style={{ color: c }}>{band}</small>
            </span>
            <b className="lv-pct">{live ? <CountUp value={v} duration={1300} suffix="%" /> : '0%'}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressVisual() {
  const { t } = useT();
  const [ref, live] = useLive();
  const pts = [41, 43, 44, 44, 49, 52, 53, 57, 58, 63, 66, 68, 71, 74, 78];
  const w = 300;
  const h = 90;
  const x = (i) => (i / (pts.length - 1)) * w;
  const y = (v) => h - 6 - ((v - 30) / 60) * (h - 12);
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <div ref={ref} className={`lv-frame${live ? ' live' : ''}`} aria-hidden>
      <div className="lv-card">
        <div className="lv-head">
          <span>{t('Progress')}</span>
          <b className="lv-big">
            <span className="muted">41 →</span> {live ? <CountUp value={78} duration={1800} /> : 0}
          </b>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ marginTop: 10 }}>
          <path d={`${d} L${w},${h} L0,${h} Z`} fill="var(--primary-tint)" className="lv-area" />
          <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="lv-line" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="lv-ideal">
          {[t('SAT in the admitted range'), t('A Tier 1–2 activity'), t('Essay draft ready')].map((x, i) => (
            <span key={x} style={{ transitionDelay: `${900 + i * 160}ms` }}>
              <Icon name="check" size={12} strokeWidth={3} /> {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SchoolVisual() {
  const { t } = useT();
  const [ref, live] = useLive();
  return (
    <div ref={ref} className={`lv-frame${live ? ' live' : ''}`} aria-hidden>
      <div className="lv-card">
        <div className="lv-head">
          <span>{t('Workspace')} · {t('Class of 2027')}</span>
          <span className="lv-chip good">{live ? <CountUp value={46} duration={1300} /> : 0} {t('students')}</span>
        </div>
        <div className="lv-kpis">
          {[
            [t('Avg strength'), 64, 'var(--primary)'],
            [t('Test-ready'), 31, 'var(--good)'],
            [t('Need attention'), 7, 'var(--warn)'],
          ].map(([l, v, c]) => (
            <div key={l}>
              <b style={{ color: c }}>{live ? <CountUp value={v} duration={1400} /> : 0}</b>
              <small>{l}</small>
            </div>
          ))}
        </div>
        {[
          ['A', 'Aigerim S.', 16, 68],
          ['D', 'Daniyar T.', 15, 61],
          ['M', 'Madina K.', 15, 63],
        ].map(([av, name, n, s], i) => (
          <div key={name} className="lv-coun">
            <span className="lv-av">{av}</span>
            <span style={{ flex: '0 0 92px', fontWeight: 600 }}>{name}</span>
            <Bar pct={(n / 16) * 100} live={live} color="var(--primary)" delay={300 + i * 120} />
            <small className="muted" style={{ flex: '0 0 auto' }}>{t('{n} students', { n })} · {s}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export const LV_CSS = `
.lv-card{background:var(--surface); border:1px solid var(--line); border-radius:16px; padding:16px 18px;
  box-shadow:0 1px 0 rgba(27,26,36,.03), 0 24px 48px -32px rgba(27,26,36,.35);}
.lv-head{display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:13px; font-weight:650;}
.lv-chip{font-size:11.5px; font-weight:650; padding:3px 9px; border-radius:999px; background:var(--primary-tint); color:var(--primary-600); white-space:nowrap;}
.lv-chip.good{background:var(--good-tint); color:var(--good);}
.lv-big{font-family:var(--display); font-weight:400; font-size:22px;}
.lv-ring{position:relative; flex-shrink:0;}
.lv-ring > span{position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-family:var(--display); font-size:26px;}
.lv-bar{display:block; height:7px; border-radius:999px; background:var(--line); overflow:hidden; flex:1; min-width:0;}
.lv-bar > span{display:block; height:100%; border-radius:999px; transition:width 1.3s var(--ease);}
.lv-pillar{display:grid; grid-template-columns:78px 1fr; gap:10px; align-items:center; font-size:12px; color:var(--muted);}

.lv-hero{position:relative; min-height:480px;}
.lv-glow{position:absolute; inset:8% 4% 10% 10%; border-radius:50%; background:radial-gradient(closest-side, rgba(69,133,217,.28), rgba(69,133,217,0)); filter:blur(8px); animation:lvPulse 6s ease-in-out infinite;}
.lv-hero .lv-card{position:absolute; opacity:0; transform:translateY(18px) scale(.98); transition:opacity .9s var(--ease), transform .9s var(--ease);}
.lv-hero.live .lv-card{opacity:1; transform:none;}
.lv-h-main{top:0; left:0; right:14%;}
.lv-h-tasks{top:176px; right:0; width:58%; transition-delay:.18s !important; z-index:2;}
.lv-h-odds{top:338px; left:0; width:66%; z-index:3; transition-delay:.32s !important;}
.lv-hero.live .lv-h-main{animation:lvFloat 7s ease-in-out 1.2s infinite;}
.lv-hero.live .lv-h-tasks{animation:lvFloat 8s ease-in-out 1.6s infinite reverse;}
.lv-hero.live .lv-h-odds{animation:lvFloat 9s ease-in-out 2s infinite;}
@keyframes lvFloat{0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);}}
@keyframes lvPulse{0%,100%{opacity:.8; transform:scale(1);} 50%{opacity:1; transform:scale(1.05);}}

.lv-task{display:flex; gap:10px; align-items:center; font-size:12.5px; padding:8px 10px; margin-top:8px; border:1px solid var(--line); border-radius:10px; transition:background .5s var(--ease), border-color .5s var(--ease), color .5s var(--ease);}
.lv-check{width:17px; height:17px; border-radius:5px; border:1.5px solid var(--line-strong); flex-shrink:0; display:flex; align-items:center; justify-content:center; color:transparent; transition:all .4s var(--ease-spring);}
.lv-task.done{background:var(--good-tint); border-color:#cde7da; color:var(--muted);}
.lv-task.done > span:last-child{text-decoration:line-through; text-decoration-color:rgba(0,0,0,.25);}
.lv-task.done .lv-check{background:var(--good); border-color:var(--good); color:#fff; transform:scale(1.08);}

.lv-odd{display:grid; grid-template-columns:34px minmax(0,1fr) 70px 40px; gap:10px; align-items:center; font-size:12.5px; margin-top:10px;}
.lv-odd-name{white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
.lv-rank{font-size:11.5px; font-weight:700; color:var(--primary-600); background:var(--primary-tint); border-radius:6px; padding:2px 0; text-align:center; min-width:34px;}
.lv-pct{text-align:right; font-variant-numeric:tabular-nums; font-size:13px;}

.lv-frame{position:relative;}
.lv-frame::before{content:''; position:absolute; inset:-18px; border-radius:24px; background:linear-gradient(135deg, rgba(69,133,217,.10), rgba(69,133,217,0) 60%); z-index:0;}
.lv-frame .lv-card{position:relative; z-index:1; opacity:0; transform:translateY(16px); transition:opacity .8s var(--ease), transform .8s var(--ease);}
.lv-frame.live .lv-card{opacity:1; transform:none;}
.lv-frame .lv-sec,.lv-frame .lv-act,.lv-frame .lv-uni,.lv-frame .lv-ideal span{opacity:0; transform:translateY(8px); transition:opacity .6s var(--ease), transform .6s var(--ease);}
.lv-frame.live .lv-sec,.lv-frame.live .lv-act,.lv-frame.live .lv-uni,.lv-frame.live .lv-ideal span{opacity:1; transform:none;}

.lv-sections{display:grid; gap:8px; margin-top:14px;}
.lv-sec{display:flex; gap:10px; align-items:center; padding:9px 10px; border:1px solid var(--line); border-radius:10px;}
.lv-sec b,.lv-act b,.lv-uni b{display:block; font-size:13px; font-weight:650; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
.lv-sec small,.lv-act small,.lv-uni small{display:block; font-size:11.5px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
.lv-sec-ic{width:26px; height:26px; border-radius:8px; background:var(--surface-2); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; color:var(--muted); flex-shrink:0;}
.lv-sec-ic.ok{background:var(--good); border-color:var(--good); color:#fff;}

.lv-act{display:flex; gap:12px; align-items:center; padding:11px 0; border-bottom:1px solid var(--line);}
.lv-tier{font-size:11px; font-weight:800; border:1.5px solid; border-radius:7px; padding:3px 6px; flex-shrink:0;}
.lv-score{font-family:var(--display); font-weight:400 !important; font-size:18px !important;}
.lv-note{display:flex; gap:9px; margin-top:12px; padding:10px 12px; border-radius:10px; background:var(--primary-tint); font-size:12.5px; line-height:1.5; color:var(--ink-2);}

.lv-streak{font-size:12px; color:var(--muted); font-weight:600;}
.lv-streak b{font-family:var(--display); font-weight:400; font-size:17px; color:var(--ink); margin-right:3px;}
.lv-days{display:grid; grid-template-columns:repeat(14,1fr); gap:4px; margin-top:14px;}
.lv-days span{aspect-ratio:1; border-radius:4px; background:var(--line); transition:background .4s var(--ease);}
.lv-frame.live .lv-days span.on{background:var(--good);}

.lv-tabs{display:flex; gap:4px; padding:3px; border-radius:10px; background:var(--surface-2); border:1px solid var(--line); width:max-content; max-width:100%;}
.lv-tabs span{font-size:11.5px; font-weight:650; padding:5px 10px; border-radius:7px; color:var(--muted);}
.lv-tabs span.on{background:var(--ink); color:#fff;}
.lv-uni{display:flex; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid var(--line);}
.lv-uni:last-child{border-bottom:0; padding-bottom:0;}

.lv-area{opacity:0; transition:opacity 1s var(--ease) .8s;}
.lv-frame.live .lv-area{opacity:.8;}
.lv-line{stroke-dasharray:1; stroke-dashoffset:1;}
.lv-frame.live .lv-line{animation:lvDraw 1.8s var(--ease) .2s forwards;}
@keyframes lvDraw{to{stroke-dashoffset:0;}}
.lv-ideal{display:flex; flex-wrap:wrap; gap:6px; margin-top:12px;}
.lv-ideal span{display:inline-flex; gap:5px; align-items:center; font-size:11.5px; font-weight:600; color:var(--good); background:var(--good-tint); padding:4px 9px; border-radius:999px;}

.lv-kpis{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin:14px 0 6px;}
.lv-kpis div{padding:10px; border:1px solid var(--line); border-radius:10px;}
.lv-kpis b{display:block; font-family:var(--display); font-weight:400; font-size:22px;}
.lv-kpis small{font-size:11px; color:var(--muted);}
.lv-coun{display:flex; gap:10px; align-items:center; font-size:12.5px; margin-top:10px;}
.lv-av{width:26px; height:26px; border-radius:999px; background:var(--primary-tint); color:var(--primary-600); font-weight:700; font-size:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;}

@media (max-width:900px){
  .lv-hero{min-height:0; display:grid; gap:12px;}
  .lv-hero .lv-card{position:relative; inset:auto; width:auto !important; left:auto; right:auto; top:auto;}
  .lv-hero.live .lv-card{animation:none !important;}
}
@media (max-width:480px){
  .lv-coun small{display:none;}
  .lv-odd{grid-template-columns:30px minmax(0,1fr) 50px 36px;}
}
@media (prefers-reduced-motion: reduce){
  .lv-hero.live .lv-card, .lv-glow{animation:none !important;}
}
`;
