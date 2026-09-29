'use client';

// Small line chart for trends (profile strength over time). The line draws
// itself in on mount; with fewer than two points it shows a quiet hint.

import { useT } from '@/lib/i18n';

export default function Sparkline({ points = [], height = 64, min = 0, max = 100, labels }) {
  const { t } = useT();
  if (points.length < 2) {
    return (
      <p className="muted" style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
        {t('Your trend appears after a couple of days. Come back tomorrow.')}
      </p>
    );
  }
  const w = 300;
  const lo = Math.min(min, ...points);
  const hi = Math.max(max, ...points);
  const x = (i) => (i / (points.length - 1)) * w;
  const y = (v) => height - 6 - ((v - lo) / (hi - lo || 1)) * (height - 12);
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${w},${height} L0,${height} Z`;
  return (
    <div style={{ marginTop: 12 }}>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={t('Profile strength over time')}>
        <path d={area} fill="var(--primary-tint)" opacity="0.7" />
        <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="spark-line" vectorEffect="non-scaling-stroke" />
      </svg>
      {labels && (
        <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
      <style>{`
        .spark-line{stroke-dasharray:1; stroke-dashoffset:1; animation:draw 1.2s var(--ease) .1s forwards;}
        @keyframes draw{to{stroke-dashoffset:0;}}
      `}</style>
    </div>
  );
}
