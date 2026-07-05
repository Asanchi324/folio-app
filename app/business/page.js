'use client';

// Workspace → Overview. The 30-second morning read: cohort health, who needs
// attention, what's due soon, and the setup checklist while the workspace is
// young.

import Link from 'next/link';
import { useWorkspace, cohortStats, rowName } from '@/lib/workspace';
import { PageHead, Kpi, CopyChip, EmptyCard } from './ui';
import { urgency, formatDeadline } from '@/lib/deadlines';
import Ring from '@/components/Ring';

export default function OverviewPage() {
  const { org, students, staff, rows, rowsReady, paid, seatLimit } = useWorkspace();
  const stats = cohortStats(rows);

  const attention = [...rows]
    .sort(
      (a, b) =>
        b.summary.flags.filter((f) => f.severity === 'bad').length -
          a.summary.flags.filter((f) => f.severity === 'bad').length ||
        a.summary.strength - b.summary.strength
    )
    .slice(0, 5);

  const showChecklist = students.length < 3;

  return (
    <>
      <PageHead
        title="Overview"
        sub={`${org?.name || 'Your workspace'} at a glance — cohort health, attention list and upcoming windows.`}
      />

      {/* KPIs */}
      <div className="ov-kpis">
        <Kpi label="Students" value={students.length} hint={`of ${seatLimit} seats`} />
        <Kpi label="Avg strength" value={rowsReady ? stats.avgStrength : '…'} hint="out of 100" tone="var(--primary)" />
        <Kpi label="Avg completeness" value={rowsReady ? `${stats.avgCompleteness}%` : '…'} hint="portfolio filled in" />
        <Kpi
          label="Needs attention"
          value={rowsReady ? stats.needsAttention : '…'}
          hint="with critical gaps"
          tone={stats.needsAttention > 0 ? 'var(--warn)' : 'var(--good)'}
        />
      </div>

      {showChecklist && <SetupChecklist org={org} students={students} staff={staff} paid={paid} />}

      <div className="ov-grid" style={{ marginTop: 22 }}>
        {/* attention list */}
        <section>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Needs attention first</h2>
          {!rowsReady ? (
            <p className="muted" style={{ fontSize: 14 }}>Loading portfolios…</p>
          ) : !rows.length ? (
            <EmptyCard
              icon="🎓"
              title="No students yet"
              body="Share your invite code and students appear here the moment they connect."
              cta={<Link href="/business/students" className="btn btn-primary btn-sm">Invite students</Link>}
            />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {attention.map((r) => (
                <Link key={r.uid} href={`/counselor/student/${r.uid}`} className="card ov-row">
                  <Ring
                    value={r.summary.strength}
                    size={44}
                    stroke={6}
                    color={r.summary.strength >= 50 ? 'var(--primary)' : 'var(--warn)'}
                    label={r.summary.strength}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{rowName(r)}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                      {r.summary.flags.slice(0, 3).map((f) => (
                        <span key={f.key} className={`pill ${f.severity === 'bad' ? 'band-hard-reach' : 'band-reach'}`} style={{ fontSize: 10.5 }}>
                          {f.label}
                        </span>
                      ))}
                      {!r.summary.flags.length && (
                        <span className="pill band-safety" style={{ fontSize: 10.5 }}>On track</span>
                      )}
                    </div>
                  </div>
                  <span aria-hidden style={{ color: 'var(--faint)' }}>›</span>
                </Link>
              ))}
              <Link href="/business/students" className="muted" style={{ fontSize: 13.5, fontWeight: 600, padding: '4px 2px' }}>
                Full roster →
              </Link>
            </div>
          )}
        </section>

        {/* deadlines radar */}
        <section>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Deadline radar · next 60 days</h2>
          {!rowsReady ? (
            <p className="muted" style={{ fontSize: 14 }}>Loading…</p>
          ) : stats.deadlinesSoon.length ? (
            <div className="card" style={{ padding: '6px 18px' }}>
              {stats.deadlinesSoon.slice(0, 7).map((d, i) => (
                <div
                  key={`${d.uid}-${d.id}-${i}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}
                >
                  <span className={`pill ${urgency(d.days)}`} style={{ fontSize: 11, minWidth: 66, justifyContent: 'center' }}>
                    {d.days}d
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{d.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {d.student} · {formatDeadline(d.month)} · {d.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCard
              icon="🗓"
              title="Nothing due in 60 days"
              body="When your students track olympiad and program deadlines, the whole cohort's windows show up here."
            />
          )}
        </section>
      </div>

      <style>{`
        .ov-kpis{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:14px;}
        .ov-grid{display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,0.85fr); gap:26px; align-items:start;}
        .ov-row{display:flex; align-items:center; gap:14px; padding:13px 16px;
          transition:transform .15s ease, box-shadow .15s ease;}
        .ov-row:hover{transform:translateY(-2px); box-shadow:var(--shadow);}
        @media (max-width:1060px){.ov-kpis{grid-template-columns:repeat(2, minmax(0,1fr));}}
        @media (max-width:860px){.ov-grid{grid-template-columns:1fr;}}
      `}</style>
    </>
  );
}

function SetupChecklist({ org, students, staff, paid }) {
  const items = [
    {
      done: true,
      label: 'Workspace created',
    },
    {
      done: students.length > 0,
      label: 'Invite your first student',
      detail: org?.joinCode ? (
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          Code <b style={{ fontFamily: 'var(--display)', letterSpacing: '0.04em' }}>{org.joinCode}</b>
          <CopyChip value={typeof window !== 'undefined' ? `${window.location.origin}/join/${org.joinCode}` : org.joinCode} label="Copy invite link" />
        </span>
      ) : null,
    },
    {
      done: staff.length > 1,
      label: 'Add a counselor (optional)',
      detail: <Link href="/business/counselors" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>Counselors →</Link>,
    },
    {
      done: paid,
      label: 'Activate your plan',
      detail: <Link href="/business/billing" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>Billing →</Link>,
    },
  ];
  return (
    <div className="card card-pad" style={{ marginTop: 22 }}>
      <h2 style={{ fontSize: 17 }}>Getting set up</h2>
      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        {items.map((it) => (
          <div key={it.label} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              aria-hidden
              style={{
                width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
                background: it.done ? 'var(--good)' : 'var(--line)',
                color: it.done ? '#fff' : 'var(--muted)',
              }}
            >
              {it.done ? '✓' : ''}
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 600, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.6 : 1 }}>
              {it.label}
            </span>
            {!it.done && it.detail}
          </div>
        ))}
      </div>
    </div>
  );
}
