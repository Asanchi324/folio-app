'use client';

// Small shared UI pieces for the Business Workspace tabs.

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';

export { PageHead } from '@/components/ui';

export function Kpi({ label, value, hint, tone }) {
  return (
    <div className="card" style={{ padding: '16px 18px', minWidth: 0 }}>
      <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginTop: 4, color: tone || 'var(--ink)' }}>{value}</div>
      {hint && <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

export function CopyChip({ value, label }) {
  const { t } = useT();
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
      {copied ? t('Copied') : label || t('Copy')}
    </button>
  );
}

export function EmptyCard({ icon, title, body, cta }) {
  return (
    <div className="card card-pad" style={{ textAlign: 'center' }}>
      {icon && <Icon name={icon} size={26} style={{ color: 'var(--faint)' }} />}
      <h3 style={{ fontSize: 16.5, marginTop: 8 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.55, maxWidth: 440, marginInline: 'auto' }}>{body}</p>
      {cta && <div style={{ marginTop: 14 }}>{cta}</div>}
    </div>
  );
}

// Horizontal distribution bar with label — used across Analytics.
export function StatBar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="statbar">
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</span>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color || 'var(--primary)', borderRadius: 999, transition: 'width .5s ease' }} />
      </div>
      <span className="muted" style={{ fontSize: 12.5, textAlign: 'right' }}>
        {count} · {pct}%
      </span>
      <style>{`
        .statbar{display:grid; grid-template-columns:minmax(110px,190px) 1fr 58px; gap:12px; align-items:center;}
        @media (max-width:520px){ .statbar{grid-template-columns:1fr 58px;} .statbar > div{grid-column:1 / -1; order:3;} }
      `}</style>
    </div>
  );
}

export function LockedNote({ children }) {
  const { t } = useT();
  return (
    <p className="muted" style={{ fontSize: 13.5, display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
      <Icon name="lock" size={15} style={{ color: 'var(--accent)' }} />
      <span>
        {children}{' '}
        <Link href="/business/billing" className="link">
          {t('Choose a plan')}
        </Link>
      </span>
    </p>
  );
}
