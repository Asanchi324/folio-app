'use client';

// Workspace → Counselors. The team and how the cohort is split between them:
// each counselor's load and outcomes, unassigned students, one-click even
// distribution and per-student reassignment (admins), the mentor invite code.

import { useState } from 'react';
import Link from 'next/link';
import { useWorkspace, counselorLoad, assignCounselor, balancedAssignment, rowName } from '@/lib/workspace';
import { removeMember } from '@/lib/org';
import { useT } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { PageHead, CopyChip, EmptyCard } from '../ui';
import Ring from '@/components/Ring';
import Icon from '@/components/Icon';

const strengthColor = (s) => (s >= 75 ? 'var(--good)' : s >= 50 ? 'var(--primary)' : s >= 30 ? 'var(--warn)' : 'var(--bad)');

export default function CounselorsPage() {
  const { t } = useT();
  const { user, org, staff, students, rows, rowsReady, isAdmin, quietDays } = useWorkspace();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [open, setOpen] = useState(null);
  const load = counselorLoad(rows, staff, quietDays);
  const maxN = Math.max(1, ...load.counselors.map((c) => c.n), load.unassigned.n);

  async function remove(m) {
    if (!confirm(t('Remove {name} from the workspace?', { name: m.displayName || m.email || t('this counselor') }))) return;
    setErr('');
    setBusy(m.uid);
    try {
      // Their students go back to the unassigned pool.
      await Promise.all(rows.filter((r) => r.counselorUid === m.uid).map((r) => assignCounselor(org.id, r.uid, null)));
      await removeMember(org.id, m.uid);
    } catch {
      setErr(t('Could not remove the member.'));
    } finally {
      setBusy('');
    }
  }

  async function distribute() {
    setErr('');
    setBusy('dist');
    try {
      const ids = load.unassigned.rows.map((r) => r.uid);
      const plan = balancedAssignment(ids, staff.map((m) => m.uid), students);
      await Promise.all(Object.entries(plan).map(([uid, c]) => assignCounselor(org.id, uid, c)));
      track('students_distributed', { n: ids.length });
    } catch {
      setErr(t('Could not assign — only workspace admins can distribute students.'));
    } finally {
      setBusy('');
    }
  }

  async function reassign(studentUid, counselorUid) {
    setErr('');
    try {
      await assignCounselor(org.id, studentUid, counselorUid);
      track('student_assigned');
    } catch {
      setErr(t('Could not assign — only workspace admins can distribute students.'));
    }
  }

  return (
    <>
      <PageHead
        title={t('Counselors ({n})', { n: staff.length })}
        sub={t('Split the cohort between your team. Each counselor sees their own students first; everyone can still open any portfolio.')}
      />

      {/* load overview */}
      <div className="cs-grid stagger">
        {load.counselors.map((c) => (
          <div key={c.uid} className={`card cs-card${open === c.uid ? ' on' : ''}`}>
            <div className="cs-top">
              <span className="cs-av" aria-hidden>{(c.member.displayName || c.member.email || '?')[0].toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cs-name">
                  {c.member.displayName || c.member.email || t('Counselor')}
                  {c.uid === user?.uid && <span className="muted" style={{ fontWeight: 500 }}> · {t('you')}</span>}
                </div>
                <div className="muted" style={{ fontSize: 12.5, overflowWrap: 'anywhere' }}>{c.member.email}</div>
              </div>
              <span className={`pill ${c.member.role === 'orgAdmin' ? 'pill-gold' : 'pill-muted'}`} style={{ fontSize: 11 }}>
                {c.member.role === 'orgAdmin' ? t('Admin') : t('Counselor')}
              </span>
            </div>

            <div className="cs-load">
              <div className="bar" style={{ height: 8 }}>
                <span style={{ width: `${(c.n / maxN) * 100}%`, background: 'var(--primary)' }} />
              </div>
              <span>{t('{n} students', { n: c.n })}</span>
            </div>

            <div className="cs-stats">
              <div>
                <b style={{ color: c.avgStrength != null ? strengthColor(c.avgStrength) : undefined }}>{c.avgStrength ?? '—'}</b>
                <span>{t('Avg strength')}</span>
              </div>
              <div>
                <b style={{ color: c.attention ? 'var(--warn)' : undefined }}>{c.attention}</b>
                <span>{t('Need attention')}</span>
              </div>
              <div>
                <b style={{ color: c.inactive ? 'var(--bad)' : undefined }}>{c.inactive}</b>
                <span>{t('Quiet {n}+ days', { n: quietDays })}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(open === c.uid ? null : c.uid)} disabled={!c.n} aria-expanded={open === c.uid}>
                {open === c.uid ? t('Hide students') : t('Show students')}
              </button>
              {isAdmin && c.uid !== user?.uid && c.member.role !== 'orgAdmin' && (
                <button className="btn btn-ghost btn-sm" disabled={busy === c.uid} onClick={() => remove(c.member)}>
                  {busy === c.uid ? t('Removing…') : t('Remove')}
                </button>
              )}
            </div>

            {open === c.uid && <StudentList rows={c.rows} staff={staff} isAdmin={isAdmin} onAssign={reassign} />}
          </div>
        ))}
      </div>

      {/* unassigned */}
      <section className="card card-pad" style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18 }}>{t('Unassigned students ({n})', { n: load.unassigned.n })}</h2>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
              {load.unassigned.n
                ? t('Give every student one owner — nobody falls through the cracks.')
                : rowsReady && students.length
                  ? t('Everyone has a counselor.')
                  : t('Students appear here when they join.')}
            </p>
          </div>
          {isAdmin && load.unassigned.n > 0 && staff.length > 0 && (
            <button className="btn btn-primary btn-sm" onClick={distribute} disabled={busy === 'dist'}>
              <Icon name="users" size={15} /> {busy === 'dist' ? t('Assigning…') : t('Distribute evenly')}
            </button>
          )}
        </div>
        {load.unassigned.n > 0 && <StudentList rows={load.unassigned.rows} staff={staff} isAdmin={isAdmin} onAssign={reassign} />}
        {isAdmin && (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
            {t('Tip: turn on automatic assignment in')}{' '}
            <Link href="/business/settings" className="link">{t('Workspace settings')}</Link>.
          </p>
        )}
      </section>

      {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 14 }}>{err}</p>}

      {/* invite */}
      <div className="card card-pad" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', marginTop: 22 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="sub-title">{t('Invite counselors')}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 21, letterSpacing: '0.04em' }}>{org?.counselorCode}</span>
            <CopyChip value={org?.counselorCode || ''} label={t('Copy code')} />
            <CopyChip value={typeof window !== 'undefined' ? `${window.location.origin}/join/${org?.counselorCode}` : ''} label={t('Copy link')} />
          </div>
        </div>
        <p className="muted" style={{ fontSize: 12.5, maxWidth: 300, lineHeight: 1.55 }}>
          {t('The counselor code is separate from the student code — a student can never join as staff by accident.')}
        </p>
      </div>

      {staff.length <= 1 && (
        <div style={{ marginTop: 18 }}>
          <EmptyCard
            icon="users"
            title={t('Just you so far')}
            body={t('Share the counselor code with colleagues — they see the same roster and can split the cohort between them.')}
          />
        </div>
      )}

      <style>{`
        .cs-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(290px, 1fr)); gap:16px; align-items:start;}
        .cs-card{padding:18px; transition:border-color .25s var(--ease), box-shadow .25s var(--ease);}
        .cs-card.on{border-color:var(--primary); box-shadow:0 12px 32px -22px rgba(69,133,217,.6);}
        .cs-top{display:flex; gap:12px; align-items:center;}
        .cs-av{width:40px; height:40px; border-radius:999px; background:var(--primary-tint); color:var(--primary-600);
          display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px; flex-shrink:0;}
        .cs-name{font-weight:700; font-size:14.5px; overflow-wrap:anywhere;}
        .cs-load{display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center; margin-top:16px; font-size:13px; font-weight:600;}
        .cs-stats{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:14px; padding-top:14px; border-top:1px solid var(--line);}
        .cs-stats b{display:block; font-family:var(--display); font-size:22px; font-weight:400;}
        .cs-stats span{font-size:11.5px; color:var(--muted); line-height:1.3; display:block;}
        .cs-list{display:grid; gap:6px; margin-top:14px;}
        .cs-row{display:flex; gap:10px; align-items:center; padding:8px 10px; border:1px solid var(--line); border-radius:var(--r-sm); flex-wrap:wrap;}
        .cs-row a{display:flex; gap:10px; align-items:center; flex:1 1 160px; min-width:0; font-size:13.5px; font-weight:600;}
        .cs-row a:hover{color:var(--primary-600);}
        .cs-row select{width:auto; max-width:180px; font-size:13px; padding:5px 8px; min-height:32px;}
      `}</style>
    </>
  );
}

function StudentList({ rows, staff, isAdmin, onAssign }) {
  const { t } = useT();
  return (
    <div className="cs-list">
      {rows.map((r) => (
        <div key={r.uid} className="cs-row">
          <Link href={`/counselor/student/${r.uid}`}>
            <Ring value={r.summary.strength} size={30} stroke={4} color={strengthColor(r.summary.strength)} label={r.summary.strength} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rowName(r)}</span>
          </Link>
          {isAdmin && (
            <select value={r.counselorUid || ''} onChange={(e) => onAssign(r.uid, e.target.value || null)} aria-label={t('Counselor for {name}', { name: rowName(r) })}>
              <option value="">{t('Unassigned')}</option>
              {staff.map((m) => (
                <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
