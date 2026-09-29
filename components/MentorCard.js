'use client';

// Student-side connection to a school / counselor (Settings page).
// Transparency is the point: the student always sees WHO can read their
// portfolio and can disconnect in one click.

import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from '@/lib/account';
import { lookupJoinCode, joinOrg, leaveOrg } from '@/lib/org';
import { isFirebaseConfigured } from '@/lib/firebase';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';

export default function MentorCard({ meta }) {
  const { user, profile } = useAccount();
  const { t } = useT();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!isFirebaseConfigured()) return null;

  const connected = Boolean(meta?.orgId);

  async function connect() {
    if (!code.trim()) return;
    if (!user) {
      setErr(t('Sign in first — the connection is tied to your account.'));
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const codeDoc = await lookupJoinCode(code);
      if (!codeDoc) throw new Error(t('Code not found — double-check it.'));
      if (codeDoc.role !== 'student') throw new Error(t('That is a counselor code — ask for the student one.'));
      await joinOrg(user, codeDoc, profile?.orgId || null);
      track('org_joined', { role: 'student', via: 'settings' });
      setCode('');
    } catch (e) {
      setErr(/permission|insufficient/i.test(e?.message || '') ? t('This code looks expired or invalid — ask for a fresh one.') : e.message);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await leaveOrg(user, meta.orgId);
      track('org_left');
    } finally {
      setBusy(false);
      setConfirmLeave(false);
    }
  }

  return (
    <section className="card card-pad">
      <h2 style={{ fontSize: 19 }}>{t('School or counselor')}</h2>

      {connected ? (
        <>
          <p style={{ fontSize: 14.5, marginTop: 10, lineHeight: 1.55 }}>
            {t('Connected to {org}. Its counselors can view your portfolio (read-only) and leave comments.', {
              org: meta.orgName || t('your workspace'),
            })}
          </p>
          {!confirmLeave ? (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => setConfirmLeave(true)}>
              {t('Disconnect')}
            </button>
          ) : (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 13.5, color: 'var(--warn)', lineHeight: 1.5 }}>
                {t('They will lose access to your portfolio immediately. Continue?')}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-danger btn-sm" onClick={disconnect} disabled={busy}>
                  {t('Yes, disconnect')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmLeave(false)}>
                  {t('Cancel')}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>
            {t('Working with a counselor or school? Enter their invite code and they will see your progress and can comment on it.')}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FOLIO-7KQ2"
              maxLength={16}
              style={{ flex: '1 1 180px', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              aria-label={t('Invite code')}
            />
            <button className="btn btn-primary" onClick={connect} disabled={busy || !code.trim()}>
              {busy ? '…' : t('Connect')}
            </button>
          </div>
          {!user && (
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
              <Link href="/login" className="link">
                {t('Sign in')}
              </Link>{' '}
              {t('first — the connection is tied to your account.')}
            </p>
          )}
        </>
      )}
      {err && <p className="error-text">{err}</p>}
    </section>
  );
}
