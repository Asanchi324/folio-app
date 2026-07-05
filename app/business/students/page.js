'use client';

// Workspace → Students. The full roster: search, sort, attention flags,
// suggested talking points, CSV export (paid), invite block.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useWorkspace, rowName, rosterCsv } from '@/lib/workspace';
import { PageHead, CopyChip, EmptyCard, LockedNote } from '../ui';
import Ring from '@/components/Ring';
import { track } from '@/lib/analytics';

export default function StudentsPage() {
  const { org, students, rows, rowsReady, paid, seatLimit } = useWorkspace();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('attention');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = rows;
    if (needle) {
      arr = arr.filter(
        (r) =>
          rowName(r).toLowerCase().includes(needle) ||
          (r.email || '').toLowerCase().includes(needle) ||
          (r.summary.major || '').toLowerCase().includes(needle)
      );
    }
    arr = [...arr];
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
  }, [rows, q, sort]);

  function exportCsv() {
    const blob = new Blob([rosterCsv(filtered)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `folio-cohort-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    track('cohort_csv_export');
  }

  const full = students.length >= seatLimit;

  return (
    <>
      <PageHead
        title={`Students (${students.length})`}
        sub="Every connected portfolio with its strength, gaps and what to discuss next."
        right={
          paid ? (
            <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>
              ⬇ Export CSV
            </button>
          ) : null
        }
      />

      {/* invite */}
      <div className="card card-pad" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Invite students
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 21, letterSpacing: '0.04em' }}>{org?.joinCode}</span>
            <CopyChip value={org?.joinCode || ''} label="Copy code" />
            <CopyChip
              value={typeof window !== 'undefined' ? `${window.location.origin}/join/${org?.joinCode}` : ''}
              label="Copy invite link"
            />
          </div>
          {full && (
            <p style={{ fontSize: 13, color: 'var(--warn)', marginTop: 8 }}>
              Seats are full ({students.length}/{seatLimit}) —{' '}
              <Link href="/business/billing" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                upgrade for more
              </Link>.
            </p>
          )}
        </div>
        <p className="muted" style={{ fontSize: 12.5, maxWidth: 300, lineHeight: 1.55 }}>
          Students sign in with Google, enter the code, and appear here with a
          live read-only view of their portfolio. They can disconnect anytime.
        </p>
      </div>

      {/* controls */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or major…"
          style={{ flex: 1, minWidth: 200, maxWidth: 340 }}
          aria-label="Search students"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto', fontSize: 13.5 }} aria-label="Sort students">
          <option value="attention">Needs attention first</option>
          <option value="strength">By strength</option>
          <option value="recent">Recently active</option>
        </select>
      </div>
      {!paid && rows.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <LockedNote>CSV export is included in Business.</LockedNote>
        </div>
      )}

      {/* roster */}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {!rowsReady && !rows.length && <p className="muted">Loading portfolios…</p>}
        {rowsReady && !students.length && (
          <EmptyCard
            icon="🎓"
            title="No students yet"
            body="Share your invite code above — students appear here the moment they connect their portfolio."
          />
        )}
        {rowsReady && students.length > 0 && !filtered.length && (
          <p className="muted" style={{ fontSize: 14 }}>No students match “{q}”.</p>
        )}
        {filtered.map((r) => (
          <StudentRow key={r.uid} r={r} />
        ))}
      </div>
    </>
  );
}

function StudentRow({ r }) {
  const s = r.summary;
  const name = rowName(r);
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
