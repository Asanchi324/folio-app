'use client';

// Share & export: public link toggle + visibility options + PDF. While sharing
// is on, the snapshot refreshes after edits so the public page never goes stale.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useEffectivePlan } from '@/lib/account';
import { publishShare, unpublishShare, DEFAULT_SHARE_OPTIONS } from '@/lib/share';
import { planHas, isOrgPaidPlan } from '@/lib/plans';
import { isFirebaseConfigured } from '@/lib/firebase';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';

export default function ShareCard({ p, meta }) {
  const { t } = useT();
  const { user, plan, org } = useEffectivePlan();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const [options, setOptions] = useState(meta?.shareOptions || DEFAULT_SHARE_OPTIONS);
  const shareId = meta?.shareId || null;
  const refreshTimer = useRef(null);

  useEffect(() => {
    if (meta?.shareOptions) setOptions(meta.shareOptions);
  }, [meta?.shareOptions]);

  const cleanShare = planHas(plan, 'cleanShare');
  const brand = isOrgPaidPlan(org?.plan) ? org?.brandName || org?.name : null;
  const extras = { badge: !cleanShare, brand };

  useEffect(() => {
    if (!shareId || !user) return;
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      publishShare(user, p, options, shareId, extras).catch(() => {});
    }, 1500);
    return () => clearTimeout(refreshTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, options, shareId, user, cleanShare, brand]);

  const url = shareId && typeof window !== 'undefined' ? `${window.location.origin}/p/${shareId}` : '';

  async function toggle() {
    setErr('');
    if (!user) {
      setErr(t('Sign in to create your public link.'));
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
      setErr(t('Could not update sharing — try again.'));
    } finally {
      setBusy(false);
    }
  }

  const setOpt = (k, v) => setOptions((o) => ({ ...o, [k]: v }));

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {isFirebaseConfigured() && (
        <section className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 19 }}>{t('Public link')}</h2>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
                {shareId ? t('Live — anyone with the link can view the parts you choose.') : t('Off. Nobody can see your portfolio.')}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={Boolean(shareId)}
              aria-label={t('Public link')}
              onClick={toggle}
              disabled={busy}
              className={`switch${shareId ? ' on' : ''}`}
            >
              <span />
            </button>
          </div>

          {shareId && (
            <div className="fade-in" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly value={url} style={{ fontSize: 14, color: 'var(--muted)' }} onFocus={(e) => e.target.select()} aria-label={t('Public link')} />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    navigator.clipboard?.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                    track('share_link_copied');
                  }}
                >
                  {copied ? t('Copied') : t('Copy')}
                </button>
              </div>
              <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
                <Check label={t('Show test scores')} on={options.testing !== false} set={(v) => setOpt('testing', v)} />
                <Check label={t('Show strength score')} on={options.strength !== false} set={(v) => setOpt('strength', v)} />
                <Check label={t('Include spike and essay')} on={options.narrative === true} set={(v) => setOpt('narrative', v)} />
              </div>
              {!cleanShare && (
                <p className="muted" style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
                  {t('Free links carry a small “Made with Folio” badge.')}{' '}
                  <Link href="/upgrade?plan=pro" className="link">{t('Pro removes it')}</Link>
                </p>
              )}
            </div>
          )}
          {!user && <p className="muted" style={{ fontSize: 13.5, marginTop: 10 }}>{t('Sign in to create your public link.')}</p>}
          {err && <p className="error-text">{err}</p>}
        </section>
      )}

      <section className="card card-pad">
        <h2 style={{ fontSize: 19 }}>{t('PDF')}</h2>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>
          {t('A clean, Common App–style summary for counselor meetings and scholarship applications.')}
        </p>
        <Link href="/portfolio/print" className="btn btn-ghost" style={{ marginTop: 14 }}>
          <Icon name="download" size={16} /> {t('Open printable PDF')}
        </Link>
      </section>

      <style>{`
        .switch{width:46px; height:26px; border-radius:999px; border:0; cursor:pointer; background:var(--line-strong); position:relative; flex-shrink:0; transition:background .2s;}
        .switch span{position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:999px; background:#fff; transition:left .2s; box-shadow:0 1px 3px rgba(0,0,0,.2);}
        .switch.on{background:var(--good);}
        .switch.on span{left:23px;}
      `}</style>
    </div>
  );
}

function Check({ label, on, set }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} style={{ width: 18, height: 18 }} />
      {label}
    </label>
  );
}
