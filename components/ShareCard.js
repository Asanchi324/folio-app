'use client';

// Share & export card (portfolio sidebar): public link toggle + PDF button.
// While sharing is ON, the snapshot silently refreshes after edits so the
// public page never goes stale.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useEffectivePlan } from '@/lib/account';
import { publishShare, unpublishShare, DEFAULT_SHARE_OPTIONS } from '@/lib/share';
import { planHas, isOrgPaidPlan } from '@/lib/plans';
import { isFirebaseConfigured } from '@/lib/firebase';
import { track } from '@/lib/analytics';

export default function ShareCard({ p, meta }) {
  const { user, plan, org } = useEffectivePlan();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const [options, setOptions] = useState(meta?.shareOptions || DEFAULT_SHARE_OPTIONS);
  const shareId = meta?.shareId || null;
  const refreshTimer = useRef(null);

  // Keep local options in sync when the doc loads.
  useEffect(() => {
    if (meta?.shareOptions) setOptions(meta.shareOptions);
  }, [meta?.shareOptions]);

  const cleanShare = planHas(plan, 'cleanShare');
  const brand = isOrgPaidPlan(org?.plan) ? org?.brandName || org?.name : null;
  const extras = { badge: !cleanShare, brand };

  // Auto-refresh the snapshot (debounced) while sharing is on.
  useEffect(() => {
    if (!shareId || !user) return;
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      publishShare(user, p, options, shareId, extras).catch(() => {});
    }, 1500);
    return () => clearTimeout(refreshTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, options, shareId, user, cleanShare, brand]);

  if (!isFirebaseConfigured()) return null;

  const url = shareId && typeof window !== 'undefined' ? `${window.location.origin}/p/${shareId}` : '';

  async function toggle() {
    setErr('');
    if (!user) {
      setErr('Sign in to create your public link.');
      return;
    }
    setBusy(true);
    try {
      if (shareId) {
        await unpublishShare(user, shareId);
        track('share_disabled');
      } else {
        await publishShare(user, p, options, null, extras);
        track('share_enabled');
      }
    } catch {
      setErr('Could not update sharing — try again.');
    } finally {
      setBusy(false);
    }
  }

  function setOpt(k, v) {
    setOptions((o) => ({ ...o, [k]: v }));
  }

  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🔗</span>
        <h3 style={{ fontSize: 17, flex: 1 }}>Share & export</h3>
      </div>

      {/* public link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <button
          role="switch"
          aria-checked={Boolean(shareId)}
          onClick={toggle}
          disabled={busy}
          style={{
            width: 42,
            height: 24,
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            background: shareId ? 'var(--good)' : 'var(--line-strong)',
            position: 'relative',
            transition: 'background .2s',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: shareId ? 21 : 3,
              width: 18,
              height: 18,
              borderRadius: 999,
              background: '#fff',
              transition: 'left .2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          Public link {shareId ? 'is live' : 'off'}
        </span>
      </div>

      {shareId && (
        <div className="fade-in" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input readOnly value={url} style={{ fontSize: 12.5, color: 'var(--muted)' }} onFocus={(e) => e.target.select()} />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
                track('share_link_copied');
              }}
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: 7, marginTop: 12 }}>
            <Check label="Show test scores" on={options.testing !== false} set={(v) => setOpt('testing', v)} />
            <Check label="Show strength score" on={options.strength !== false} set={(v) => setOpt('strength', v)} />
            <Check label="Include spike & essay" on={options.narrative === true} set={(v) => setOpt('narrative', v)} />
          </div>

          {!cleanShare && (
            <p className="muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
              Free links carry a small “Made with Folio” badge.{' '}
              <Link href="/upgrade?plan=pro" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                Pro removes it →
              </Link>
            </p>
          )}
        </div>
      )}

      {/* PDF */}
      <Link href="/portfolio/print" className="btn btn-ghost btn-sm" style={{ marginTop: 16, width: '100%' }}>
        📄 Download PDF (Common App preview)
      </Link>

      {err && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 10 }}>{err}</p>}
    </div>
  );
}

function Check({ label, on, set }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, cursor: 'pointer', marginBottom: 0 }}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} style={{ width: 15, height: 15 }} />
      {label}
    </label>
  );
}
