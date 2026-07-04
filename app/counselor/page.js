'use client';

// Counselor dashboard: the roster. Shows every connected student with
// strength, completeness, attention flags and suggested next steps — the
// point is that a counselor opens this before a meeting and knows exactly
// what to talk about.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAccount } from '@/lib/account';
import { useOrg, useMembers } from '@/lib/org';
import { studentSummary } from '@/lib/insights';
import { orgSeatLimit } from '@/lib/plans';
import Ring from '@/components/Ring';
import { track } from '@/lib/analytics';

export default function CounselorDashboard() {
  const { user, ready, profile } = useAccount();
  const orgId = profile?.orgId;
  const { org } = useOrg(orgId);
  const { members, ready: membersReady } = useMembers(orgId);
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [sort, setSort] = useState('attention');

  const isStaff = profile?.role === 'counselor' || profile?.role === 'orgAdmin';
  const students = useMemo(() => members.filter((m) => m.role === 'student'), [members]);
  const businessPlan = org?.plan === 'business';

  useEffect(() => {
    track('counselor_dashboard_view');
  }, []);

  // Pull each student's portfolio (counselor read is allowed by rules).
  useEffect(() => {
    const db = getDb();
    if (!db || !students.length) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoadingRows(true);
    (async () => {
      const out = await Promise.all(
        students.map(async (m) => {
          try {
            const snap = await getDoc(doc(db, 'portfolios', m.uid));
            const raw = snap.exists() ? snap.data() : null;
            return {
              uid: m.uid,
              email: m.email,
              joinedAt: m.joinedAt,
              updatedAt: raw?.updatedAt || null,
              summary: studentSummary(raw?.data || null),
              displayName: m.displayName,
            };
          } catch {
            return {
              uid: m.uid,
              email: m.email,
              joinedAt: m.joinedAt,
              updatedAt: null,
              summary: studentSummary(null),
              displayName: m.displayName,
              denied: true,
            };
          }
        })
      );
      if (!cancelled) {
        setRows(out);
        setLoadingRows(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [students]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    if (sort === 'attention') {
      arr.sort(
        (a, b) =>
          b.summary.flags.length - a.summary.flags.length ||
          a.summary.completeness - b.summary.completeness
      );
    } else if (sort === 'strength') {
      arr.sort((a, b) => b.summary.strength - a.summary.strength);
    } else {
      arr.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return arr;
  }, [rows, sort]);

  function exportCsv() {
    const head = ['Name', 'Email', 'Grade', 'Major', 'Strength', 'Completeness %', 'Flags', 'Next steps'];
    const lines = sorted.map((r) => {
      const s = r.summary;
      return [
        s.name === '—' ? r.displayName : s.name,
        r.email || '',
        s.grade,
        s.major,
        s.strength,
        s.completeness,
        s.flags.map((f) => f.label).join('; '),
        s.steps.join('; '),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `folio-cohort-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    track('cohort_csv_export');
  }

  if (!ready) return <Shell title="Dashboard"><p className="muted">Loading…</p></Shell>;

  if (!user || !isStaff || !orgId) {
    return (
      <Shell title="Counselor dashboard">
        <div className="card card-pad" style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
          <div style={{ fontSize: 28 }}>🧑‍🏫</div>
          <h3 style={{ fontSize: 19, marginTop: 10 }}>No workspace yet</h3>
          <p className="muted" style={{ fontSize: 14.5, marginTop: 8, lineHeight: 1.55 }}>
            Create a free workspace to see your students’ portfolios, progress and
            gaps in one place — or join one with a mentor code.
          </p>
          <Link href="/counselor/new" className="btn btn-primary" style={{ marginTop: 16 }}>
            Create a workspace
          </Link>
        </div>
      </Shell>
    );
  }

  const seatLimit = orgSeatLimit(org);

  return (
    <Shell
      title={org?.name || 'Dashboard'}
      right={
        <span className={`pill ${businessPlan ? 'pill-gold' : 'pill-muted'}`}>
          {businessPlan ? 'Business' : `Free pilot · ${students.length}/${seatLimit} seats`}
        </span>
      }
    >
      {/* invite block */}
      <InviteCard org={org} studentCount={students.length} seatLimit={seatLimit} />

      {/* roster controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 28, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 20 }}>Students ({students.length})</h2>
        <div style={{ flex: 1 }} />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto', fontSize: 13.5 }}>
          <option value="attention">Needs attention first</option>
          <option value="strength">By strength</option>
          <option value="recent">Recently active</option>
        </select>
        {businessPlan ? (
          <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>
            ⬇ CSV
          </button>
        ) : (
          <Link href="/upgrade" className="btn btn-ghost btn-sm" title="CSV export is a Business feature">
            <span style={{ color: 'var(--accent)' }}>🔒</span> CSV
          </Link>
        )}
      </div>

      {/* roster */}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {loadingRows && !rows.length && <p className="muted">Loading portfolios…</p>}
        {!loadingRows && !students.length && (
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <p className="muted" style={{ fontSize: 14.5 }}>
              No students yet — share your invite code above. They sign in with
              Google, enter the code, and appear here instantly.
            </p>
          </div>
        )}
        {sorted.map((r) => (
          <StudentRow key={r.uid} r={r} />
        ))}
      </div>
    </Shell>
  );
}

function InviteCard({ org, studentCount, seatLimit }) {
  const [copied, setCopied] = useState('');
  if (!org) return null;
  const link = typeof window !== 'undefined' ? `${window.location.origin}/join/${org.joinCode}` : '';

  function copy(text, tag) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(tag);
      setTimeout(() => setCopied(''), 1600);
    });
  }

  const full = studentCount >= seatLimit;

  return (
    <div className="card card-pad" style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Invite students
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 22, letterSpacing: '0.04em' }}>{org.joinCode}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => copy(org.joinCode, 'code')}>
            {copied === 'code' ? '✓ Copied' : 'Copy code'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => copy(link, 'link')}>
            {copied === 'link' ? '✓ Copied' : 'Copy invite link'}
          </button>
        </div>
        {full && (
          <p style={{ fontSize: 13, color: 'var(--warn)', marginTop: 8 }}>
            Seats are full — <Link href="/upgrade" style={{ color: 'var(--accent)', fontWeight: 600 }}>upgrade to Business</Link> for more.
          </p>
        )}
      </div>
      <div style={{ minWidth: 200 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Invite counselors
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 17, letterSpacing: '0.04em' }}>{org.counselorCode}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => copy(org.counselorCode, 'mcode')}>
            {copied === 'mcode' ? '✓' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentRow({ r }) {
  const s = r.summary;
  const name = s.name === '—' ? r.displayName || r.email || 'Student' : s.name;
  const color =
    s.strength >= 75 ? 'var(--good)' : s.strength >= 50 ? 'var(--primary)' : s.strength >= 30 ? 'var(--warn)' : 'var(--bad)';
  const lastActive = r.updatedAt
    ? new Date(r.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <Link href={`/counselor/student/${r.uid}`} className="card roster-row" style={{ padding: 18, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
      <Ring value={s.strength} size={58} stroke={7} color={color} label={s.strength} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 15.5 }}>{name}</div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
          {[s.grade && (s.grade === 'gap' ? 'Gap year' : `Grade ${s.grade}`), s.major, `active ${lastActive}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {s.flags.slice(0, 4).map((f) => (
            <span key={f.key} className={`pill ${f.severity === 'bad' ? 'band-hard-reach' : 'band-reach'}`} style={{ fontSize: 11 }}>
              {f.label}
            </span>
          ))}
          {s.flags.length === 0 && (
            <span className="pill band-safety" style={{ fontSize: 11 }}>No red flags</span>
          )}
        </div>
      </div>
      <div style={{ minWidth: 210, flex: 1 }}>
        <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Talk about next
        </div>
        {s.steps.map((st) => (
          <div key={st} style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.45, display: 'flex', gap: 6 }}>
            <span style={{ color: 'var(--accent)' }}>→</span>
            <span>{st}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'right', minWidth: 76 }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 19 }}>{s.completeness}%</div>
        <div className="muted" style={{ fontSize: 11.5 }}>complete</div>
      </div>
      <style>{`
        .roster-row{transition:transform .15s ease, box-shadow .15s ease;}
        .roster-row:hover{transform:translateY(-2px); box-shadow:var(--shadow);}
      `}</style>
    </Link>
  );
}

function Shell({ title, right, children }) {
  return (
    <div className="wrap" style={{ padding: '36px 24px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        <h1 style={{ fontSize: 'clamp(26px,3.6vw,36px)' }}>{title}</h1>
        {right}
      </div>
      {children}
    </div>
  );
}
