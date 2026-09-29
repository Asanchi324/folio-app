'use client';

// Small shared UI pieces for app pages.

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';

export function PageHead({ title, sub, right }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Spinner({ size = 15 }) {
  return (
    <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: '-2px' }} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Loading({ label }) {
  const { t } = useT();
  return (
    <div className="muted" style={{ padding: '70px 16px', textAlign: 'center', fontSize: 15 }}>
      <Spinner /> <span style={{ marginLeft: 8 }}>{label || t('Loading…')}</span>
    </div>
  );
}

export function Section({ title, hint, count, children, id }) {
  return (
    <section className="card card-pad" id={id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ fontSize: 20 }}>{title}</h2>
        {count != null && <span className="pill pill-muted">{count}</span>}
      </div>
      {hint && (
        <p className="muted" style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
      <div style={{ marginTop: 18 }}>{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {hint && <span className="field-hint">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

// Upsell shown when a free user hits a Pro limit (server returned upgrade:true).
export function UpgradeNote({ message }) {
  const { t } = useT();
  return (
    <div className="notice" style={{ marginTop: 12, background: 'var(--accent-tint)', borderColor: '#ead8b4' }}>
      <Icon name="lock" size={18} style={{ color: 'var(--accent)', marginTop: 2 }} />
      <div>
        <p style={{ color: '#6b4610' }}>{message}</p>
        <Link href="/upgrade?plan=pro" className="btn btn-gold btn-sm" style={{ marginTop: 10 }}>
          {t('See Pro')}
        </Link>
      </div>
    </div>
  );
}

// Tier label for an activity grade (1 = strongest).
export function TierBadge({ tier }) {
  const { t } = useT();
  const cls = { 1: 'band-safety', 2: 'band-target', 3: 'band-reach', 4: 'band-hard-reach' }[tier] || 'pill-muted';
  return <span className={`pill ${cls}`}>{t('Tier {n}', { n: tier })}</span>;
}
