'use client';

// Student-side mentor connection card (portfolio sidebar).
// Transparency is the whole point: the student always sees WHO can read their
// portfolio and can disconnect in one click.

import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from '@/lib/account';
import { lookupJoinCode, joinOrg, leaveOrg } from '@/lib/org';
import { isFirebaseConfigured } from '@/lib/firebase';
import { track } from '@/lib/analytics';

export default function MentorCard({ meta }) {
  const { user, profile } = useAccount();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!isFirebaseConfigured()) return null;

  const connected = Boolean(meta?.orgId);

  async function connect() {
    if (!code.trim()) return;
    if (!user) {
      setErr('Sign in first — the connection is tied to your account.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const codeDoc = await lookupJoinCode(code);
      if (!codeDoc) throw new Error('Code not found — double-check it.');
      if (codeDoc.role !== 'student') throw new Error('That’s a mentor code — ask for the student one.');
      await joinOrg(user, codeDoc);
      track('org_joined', { role: 'student', via: 'settings' });
      setCode('');
    } catch (e) {
      setErr(e.message || 'Could not connect.');
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
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🤝</span>
        <h3 style={{ fontSize: 17 }}>Your mentor</h3>
      </div>

      {connected ? (
        <>
          <p style={{ fontSize: 14, marginTop: 12, lineHeight: 1.55 }}>
            Connected to <b>{meta.orgName || 'your workspace'}</b>. Its counselors can
            view your portfolio (read-only) and leave comments.
          </p>
          {!confirmLeave ? (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 14 }}
              onClick={() => setConfirmLeave(true)}
            >
              Disconnect
            </button>
          ) : (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--warn)', lineHeight: 1.5 }}>
                Your mentor will lose access to your portfolio immediately. Sure?
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-sm" style={{ background: 'var(--bad)', color: '#fff' }} onClick={disconnect} disabled={busy}>
                  Yes, disconnect
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmLeave(false)}>Cancel</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.55 }}>
            Working with a counselor or school? Enter their invite code and they’ll
            see your progress and coach you right here.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FOLIO-7KQ2"
              style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}
            />
            <button className="btn btn-primary btn-sm" onClick={connect} disabled={busy || !code.trim()}>
              {busy ? '…' : 'Connect'}
            </button>
          </div>
          {!user && (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
              You’ll need to <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>sign in</Link> first.
            </p>
          )}
        </>
      )}
      {err && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 10 }}>{err}</p>}
    </div>
  );
}
