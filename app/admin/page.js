'use client';

// Org overview for school admins (orgAdmin role): counselors, cohort
// aggregates, invite codes and seat usage. Deliberately an honest overview,
// not a BI machine.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAccount } from '@/lib/account';
import { useOrg, useMembers, removeMember, orgSeatLimit } from '@/lib/org';
import { studentSummary } from '@/lib/insights';

export default function OrgAdminPage() {
  const { user, ready, profile } = useAccount();
  const orgId = profile?.orgId;
  const { org } = useOrg(orgId);
  const { members } = useMembers(orgId);
  const [summaries, setSummaries] = useState([]);

  const isAdmin = profile?.role === 'orgAdmin' || (org && user && org.ownerUid === user.uid);
  const students = useMemo(() => members.filter((m) => m.role === 'student'), [members]);
  const staff = useMemo(() => members.filter((m) => m.role !== 'student'), [members]);

  useEffect(() => {
    const db = getDb();
    if (!db || !students.length) {
      setSummaries([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      students.map((m) =>
        getDoc(doc(db, 'portfolios', m.uid))
          .then((s) => studentSummary(s.exists() ? s.data().data : null))
          .catch(() => studentSummary(null))
      )
    ).then((out) => !cancelled && setSummaries(out));
    return () => {
      cancelled = true;
    };
  }, [students]);

  if (!ready) return <Shell><p className="muted">Loading…</p></Shell>;
  if (!user || !orgId || !isAdmin) {
    return (
      <Shell>
        <div className="card card-pad" style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
          <p className="muted" style={{ lineHeight: 1.6 }}>
            This page is for workspace admins. Counselors: your roster lives on the{' '}
            <Link href="/counselor" style={{ color: 'var(--primary)', fontWeight: 600 }}>dashboard</Link>.
          </p>
        </div>
      </Shell>
    );
  }

  const avg = (xs) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0);
  const avgStrength = avg(summaries.map((s) => s.strength));
  const avgComplete = avg(summaries.map((s) => s.completeness));
  const readyCount = summaries.filter((s) => s.completeness >= 80).length;
  const attention = summaries.filter((s) => s.flags.some((f) => f.severity === 'bad')).length;
  const business = org?.plan === 'business';

  return (
    <Shell
      title={org?.name}
      right={<span className={`pill ${business ? 'pill-gold' : 'pill-muted'}`}>{business ? 'Business' : 'Free pilot'}</span>}
    >
      {/* aggregates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
        <Metric label="Students" value={`${students.length} / ${orgSeatLimit(org)}`} />
        <Metric label="Avg. strength" value={avgStrength} />
        <Metric label="Avg. completeness" value={`${avgComplete}%`} />
        <Metric label="Ready portfolios" value={readyCount} hint="≥80% complete" />
        <Metric label="Need attention" value={attention} tone={attention ? 'warn' : 'good'} />
      </div>

      {/* codes */}
      <div className="card card-pad" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 17 }}>Invites</h3>
        <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginTop: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 12 }}>Student code</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 20 }}>{org?.joinCode}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12 }}>Counselor code</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 20 }}>{org?.counselorCode}</div>
          </div>
        </div>
      </div>

      {/* staff */}
      <div className="card card-pad" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 17 }}>Team ({staff.length})</h3>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {staff.map((m) => (
            <div key={m.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14.5 }}>{m.displayName || m.email}</span>
                <span className="pill pill-muted" style={{ fontSize: 10.5, marginLeft: 8 }}>{m.role}</span>
              </div>
              {m.uid !== user.uid && (
                <button className="btn btn-ghost btn-sm" onClick={() => removeMember(orgId, m.uid)}>Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* students management (light — the working view is /counselor) */}
      <div className="card card-pad" style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 17 }}>Students ({students.length})</h3>
          <Link href="/counselor" className="btn btn-ghost btn-sm">Open roster →</Link>
        </div>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {students.map((m) => (
            <div key={m.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14 }}>{m.displayName || m.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => removeMember(orgId, m.uid)}>Remove</button>
            </div>
          ))}
          {!students.length && <p className="muted" style={{ fontSize: 13.5 }}>No students yet.</p>}
        </div>
      </div>

      {!business && (
        <div className="card card-pad" style={{ marginTop: 18, borderColor: 'var(--accent)', background: 'var(--accent-tint)' }}>
          <h3 style={{ fontSize: 16 }}>🔒 Business unlocks</h3>
          <p style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>
            More seats, cohort CSV export, white-label branding on student portfolios
            & PDFs, and the counselor AI assistant.
          </p>
          <Link href="/upgrade" className="btn btn-gold btn-sm" style={{ marginTop: 12 }}>See Business →</Link>
        </div>
      )}
    </Shell>
  );
}

function Metric({ label, value, hint, tone }) {
  const color = tone === 'warn' ? 'var(--warn)' : tone === 'good' ? 'var(--good)' : 'var(--ink)';
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 26, marginTop: 4, color }}>{value}</div>
      {hint && <div className="muted" style={{ fontSize: 11 }}>{hint}</div>}
    </div>
  );
}

function Shell({ title = 'Organization', right, children }) {
  return (
    <div className="wrap" style={{ maxWidth: 860, padding: '36px 24px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        <h1 style={{ fontSize: 'clamp(26px,3.6vw,34px)' }}>{title}</h1>
        {right}
      </div>
      {children}
    </div>
  );
}
