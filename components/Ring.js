'use client';

// Circular progress ring (profile strength, chances). Draws itself in on
// mount and eases between values; the label counts up alongside.

import { useEffect, useState } from 'react';
import { CountUp } from '@/components/Motion';

export default function Ring({ value = 0, size = 120, stroke = 10, color = 'var(--primary)', track = 'var(--line)', label, sublabel }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  // Start empty, then fill on the next frame so the stroke animates in.
  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  const offset = c - (drawn / 100) * c;
  const numeric = typeof label === 'number' || (typeof label === 'string' && /^\d+$/.test(label));

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,.8,.24,1), stroke .4s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: size * 0.27, lineHeight: 1, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
          {numeric ? <CountUp value={Number(label)} /> : label}
        </span>
        {sublabel && (
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 4 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
