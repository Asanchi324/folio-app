'use client';

// Small shared UI pieces for the Business Workspace tabs.

import { useState } from 'react';
import Link from 'next/link';

export function PageHead({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 'clamp(24px,3vw,30px)' }}>{title}</h1>
        {sub && <p className="muted" style={{ marginTop: 6, fontSize: 14.5, maxWidth: 560, lineHeight: 1.55 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Kpi({ label, value, hint, tone }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 30, marginTop: 6, color: tone || 'var(--ink)' }}>
        {value}
      </div>
      {hint && <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

export function CopyChip({ value, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      {copied ? '✓ Copied' : label || 'Copy'}
    </button>
  );
}

export function EmptyCard({ icon, title, body, cta }) {
  return (
    <div className="card card-pad" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26 }}>{icon}</div>
      <h3 style={{ fontSize: 17, marginTop: 8 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.55, maxWidth: 420, marginInline: 'auto' }}>{body}</p>
      {cta && <div style={{ marginTop: 14 }}>{cta}</div>}
    </div>
  );
}

// Horizontal distribution bar with label — used across Analytics.
export function StatBar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 200px) 1fr 52px', gap: 12, alignItems: 'center' }}>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</span>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color || 'var(--primary)', borderRadius: 999, transition: 'width .5s ease' }} />
      </div>
      <span className="muted" style={{ fontSize: 12.5, textAlign: 'right' }}>{count} · {pct}%</span>
    </div>
  );
}

export function LockedNote({ children }) {
  return (
    <p className="muted" style={{ fontSize: 13, display: 'flex', gap: 7, alignItems: 'center' }}>
      <span aria-hidden style={{ color: 'var(--accent)' }}>🔒</span>
      <span>
        {children} <Link href="/business/billing" style={{ color: 'var(--accent)', fontWeight: 600 }}>Activate Business →</Link>
      </span>
    </p>
  );
}
