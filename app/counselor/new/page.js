'use client';

// Self-serve workspace creation for counselors & schools. Creates the org in
// setup mode (up to 3 students to trial the workflow) — Business activates
// automatically after checkout in /business/billing.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/lib/account';
import { createOrg } from '@/lib/org';
import { isFirebaseConfigured } from '@/lib/firebase';
import { track } from '@/lib/analytics';

export default function NewOrgPage() {
  const router = useRouter();
  const { user, ready, profile } = useAccount();
  const [name, setName] = useState('');
  const [type, setType] = useState('practice');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!name.trim()) return setErr('Give your workspace a name.');
    setBusy(true);
    setErr('');
    try {
      await createOrg({ name, type }, user);
      track('org_created', { type });
      router.push('/business?created=1');
    } catch (e) {
      setErr(e?.message || 'Could not create the workspace.');
      setBusy(false);
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <Shell>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          Workspaces need accounts, and accounts aren’t configured on this deployment
          yet. Add Firebase keys to enable them.
        </p>
      </Shell>
    );
  }

  if (ready && !user) {
    return (
      <Shell>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          Sign in with Google first — your workspace will be tied to your account.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ marginTop: 18 }}>
          Sign in to continue
        </Link>
      </Shell>
    );
  }

  if (profile?.orgId) {
    return (
      <Shell>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          You already belong to a workspace.
        </p>
        <Link href="/business" className="btn btn-primary" style={{ marginTop: 18 }}>
          Open my dashboard →
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <label className="field">
        <span className="field-label">Workspace name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="NIS Almaty · Aida's Admissions Studio"
        />
      </label>

      <span className="field-label">What are you?</span>
      <div style={{ display: 'grid', gap: 10 }}>
        {[
          ['practice', 'Independent counselor / consultancy', 'You advise students privately'],
          ['school', 'School', 'Counselors + cohorts of students'],
        ].map(([v, label, note]) => (
          <button
            key={v}
            type="button"
            onClick={() => setType(v)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              textAlign: 'left',
              padding: '14px 16px',
              borderRadius: 'var(--r-sm)',
              border: `1.5px solid ${type === v ? 'var(--primary)' : 'var(--line-strong)'}`,
              background: type === v ? 'var(--primary-tint)' : 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 15, color: type === v ? 'var(--primary)' : 'var(--ink)' }}>
              {label}
            </span>
            <span className="muted" style={{ fontSize: 12.5 }}>{note}</span>
          </button>
        ))}
      </div>

      {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 14 }}>{err}</p>}

      <button className="btn btn-primary" onClick={submit} disabled={busy || !ready} style={{ marginTop: 22, width: '100%' }}>
        {busy ? 'Creating…' : 'Create workspace'}
      </button>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
        Set up first, subscribe when ready: you can trial the workflow with up
        to 3 students before activating{' '}
        <Link href="/upgrade?plan=business" style={{ color: 'var(--accent)', fontWeight: 600 }}>Business →</Link>
      </p>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="wrap" style={{ maxWidth: 520, padding: '52px 24px 100px' }}>
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <span className="pill pill-gold">For schools & counselors</span>
        <h1 style={{ fontSize: 'clamp(28px,4vw,36px)', marginTop: 14 }}>Create your workspace</h1>
        <p className="muted" style={{ marginTop: 10, fontSize: 15.5, lineHeight: 1.55 }}>
          See every student’s portfolio, progress and gaps in one place — and leave
          comments they’ll actually read.
        </p>
      </div>
      <div className="card card-pad">{children}</div>
    </div>
  );
}
