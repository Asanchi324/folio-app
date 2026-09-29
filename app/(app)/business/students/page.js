'use client';

// Workspace → Students. Add students (by email or invite code), pending
// invites, and the roster: search, sort, attention flags, talking points,
// CSV export (paid).

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useWorkspace, rowName, rosterCsv } from '@/lib/workspace';
import { parseInviteList, createInvites, revokeInvite, removeMember } from '@/lib/org';
import { useT } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { PageHead, CopyChip, EmptyCard, LockedNote } from '../ui';
import Ring from '@/components/Ring';
import Icon from '@/components/Icon';

export default function StudentsPage() {
  const { t } = useT();
  const { org, students, rows, rowsReady, paid, seatLimit, invites, staff, user } = useWorkspace();
  const [q, setQ] = useState('');
  const [who, setWho] = useState('all');
  const [sort, setSort] = useState('attention');
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = rows;
    if (who === 'mine') arr = arr.filter((r) => r.counselorUid === user?.uid);
    else if (who === 'none') arr = arr.filter((r) => !r.counselorUid);
    else if (who !== 'all') arr = arr.filter((r) => r.counselorUid === who);
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
      arr.sort((a, b) => b.summary.flags.length - a.summary.flags.length || a.summary.completeness - b.summary.completeness);
    } else if (sort === 'strength') {
      arr.sort((a, b) => b.summary.strength - a.summary.strength);
    } else {
      arr.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return arr;
  }, [rows, q, sort, who, user?.uid]);

  function exportCsv() {
    const blob = new Blob([rosterCsv(filtered, staff)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `folio-cohort-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    track('cohort_csv_export');
  }

  const used = students.length + invites.length;
  const free = Math.max(0, seatLimit - used);

  return (
    <>
      <PageHead
        title={t('Students ({n})', { n: students.length })}
        sub={t('Every connected portfolio with its strength, gaps and what to discuss next.')}
        right={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {paid && (
              <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>
                <Icon name="download" size={15} /> CSV
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
              <Icon name="plus" size={15} /> {t('Add students')}
            </button>
          </div>
        }
      />

      {(adding || (rowsReady && !students.length && !invites.length)) && (
        <AddStudents org={org} free={free} paid={paid} onDone={() => setAdding(false)} />
      )}

      {invites.length > 0 && <PendingInvites invites={invites} org={org} />}

      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('Search name, email or major…')}
          style={{ flex: '1 1 220px', maxWidth: 360 }}
          aria-label={t('Search students')}
        />
        {staff.length > 1 && (
          <select value={who} onChange={(e) => setWho(e.target.value)} style={{ width: 'auto' }} aria-label={t('Counselor')}>
            <option value="all">{t('All students')}</option>
            <option value="mine">{t('My students')}</option>
            <option value="none">{t('Unassigned')}</option>
            {staff
              .filter((m) => m.uid !== user?.uid)
              .map((m) => (
                <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
              ))}
          </select>
        )}
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto' }} aria-label={t('Sort')}>
          <option value="attention">{t('Needs attention first')}</option>
          <option value="strength">{t('By strength')}</option>
          <option value="recent">{t('Recently active')}</option>
        </select>
      </div>
      {!paid && rows.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <LockedNote>{t('CSV export is included in paid plans.')}</LockedNote>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {!rowsReady && !rows.length && <p className="muted">{t('Loading portfolios…')}</p>}
        {rowsReady && !students.length && (
          <EmptyCard
            icon="student"
            title={t('No students connected yet')}
            body={t('Add them by email above, or share the invite code. Students appear here as soon as they accept.')}
          />
        )}
        {rowsReady && students.length > 0 && !filtered.length && (
          <p className="muted" style={{ fontSize: 14 }}>{t('No students match “{q}”.', { q })}</p>
        )}
        {filtered.map((r) => (
          <StudentRow key={r.uid} r={r} org={org} counselor={staff.length > 1 ? staff.find((m) => m.uid === r.counselorUid) || null : undefined} />
        ))}
      </div>
    </>
  );
}

function AddStudents({ org, free, paid, onDone }) {
  const { t } = useT();
  const { user } = useWorkspace();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const parsed = parseInviteList(text);
  const joinLink = typeof window !== 'undefined' && org?.joinCode ? `${window.location.origin}/join/${org.joinCode}` : '';

  async function send() {
    setMsg(null);
    if (!parsed.valid.length) return;
    if (parsed.valid.length > free) {
      setMsg({ bad: true, text: t('Only {n} seats left on your plan.', { n: free }) });
      return;
    }
    setBusy(true);
    try {
      await createInvites(org, parsed.valid, user);
      track('students_invited', { n: parsed.valid.length });
      setMsg({ bad: false, text: t('{n} invited. They will see the invitation when they sign in to Folio with that email.', { n: parsed.valid.length }) });
      setText('');
    } catch (e) {
      setMsg({ bad: true, text: t('Could not send invites — check that you are a counselor in this workspace.') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card card-pad">
      <h2 style={{ fontSize: 19 }}>{t('Add students')}</h2>
      <div className="add-grid">
        <div>
          <div className="field-label">{t('By email')}</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('One per line, e.g.\naisha.k@gmail.com\nDaniyar Sadykov <daniyar@mail.kz>')}
            style={{ minHeight: 110 }}
            aria-label={t('Student emails')}
          />
          <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
            {t('{n} valid', { n: parsed.valid.length })}
            {parsed.invalid.length > 0 && <span style={{ color: 'var(--bad)' }}> · {t('{n} not recognised', { n: parsed.invalid.length })}</span>}
            {' · '}
            {t('{n} seats free', { n: free })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={send} disabled={busy || !parsed.valid.length}>
              {busy ? t('Sending…') : t('Invite {n}', { n: parsed.valid.length || '' }).trim()}
            </button>
            <button className="btn btn-ghost" onClick={onDone}>{t('Close')}</button>
          </div>
          {msg && <p style={{ fontSize: 13.5, marginTop: 10, color: msg.bad ? 'var(--bad)' : 'var(--good)' }}>{msg.text}</p>}
          {!paid && (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>
              {t('Trial workspace: up to 3 students. Paid plans add seats and give every student Pro.')}{' '}
              <Link href="/business/billing" className="link">{t('Plans')}</Link>
            </p>
          )}
        </div>
        <div className="add-code">
          <div className="field-label">{t('Or share the invite code')}</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, letterSpacing: '0.04em', marginTop: 4 }}>{org?.joinCode}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <CopyChip value={org?.joinCode || ''} label={t('Copy code')} />
            <CopyChip value={joinLink} label={t('Copy link')} />
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.55 }}>
            {t('Students open the link, sign in with Google and confirm. They can disconnect at any time.')}
          </p>
        </div>
      </div>
      <style>{`
        .add-grid{display:grid; grid-template-columns:minmax(0,1.4fr) minmax(0,1fr); gap:22px; margin-top:14px;}
        .add-code{border-left:1px solid var(--line); padding-left:22px;}
        @media (max-width:760px){ .add-grid{grid-template-columns:minmax(0,1fr);} .add-code{border-left:0; padding-left:0; border-top:1px solid var(--line); padding-top:16px;} }
      `}</style>
    </section>
  );
}

function PendingInvites({ invites, org }) {
  const { t, locale } = useT();
  const joinLink = typeof window !== 'undefined' && org?.joinCode ? `${window.location.origin}/join/${org.joinCode}` : '';
  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <b style={{ fontSize: 15 }}>{t('Invited, not yet joined ({n})', { n: invites.length })}</b>
        <span className="muted" style={{ fontSize: 13 }}>{t('Send them the link — they join by signing in with the invited email.')}</span>
      </div>
      {invites
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .map((inv) => (
          <div key={inv.id} className="inv-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, overflowWrap: 'anywhere' }}>{inv.name || inv.email}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>
                {inv.name ? `${inv.email} · ` : ''}
                {t('invited {date}', { date: new Date(inv.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })}
              </div>
            </div>
            <CopyChip
              value={t('Hi! Join our Folio workspace: {link} — sign in with {email}.', { link: joinLink, email: inv.email })}
              label={t('Copy message')}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => revokeInvite(inv.id).catch(() => {})}>
              {t('Cancel')}
            </button>
          </div>
        ))}
      <style>{`.inv-row{display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid var(--line); flex-wrap:wrap;} .inv-row:last-child{border-bottom:0;}`}</style>
    </section>
  );
}

const FLAG_TEXT = {
  gpa: 'No GPA',
  test: 'No SAT/ACT',
  english: 'No IELTS/TOEFL',
  essay: 'No essay draft',
  acts: 'No activities',
  leadership: 'Membership, not leadership',
  honors: 'No honors',
  major: 'No intended major',
};

function StudentRow({ r, org, counselor }) {
  const { t, locale } = useT();
  const { isAdmin } = useWorkspace();
  const [confirm, setConfirm] = useState(false);
  const s = r.summary;
  const name = rowName(r);
  const color = s.strength >= 75 ? 'var(--good)' : s.strength >= 50 ? 'var(--primary)' : s.strength >= 30 ? 'var(--warn)' : 'var(--bad)';
  const lastActive = r.updatedAt ? new Date(r.updatedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : '—';

  return (
    <div className="card roster-row">
      <Link href={`/counselor/student/${r.uid}`} className="roster-main">
        <Ring value={s.strength} size={54} stroke={6} color={color} label={s.strength} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {[
              s.grade && (s.grade === 'gap' ? t('Gap year') : t('Grade {n}', { n: s.grade })),
              s.major,
              r.sat && `SAT ${r.sat}`,
              counselor !== undefined && (counselor ? `→ ${counselor.displayName || counselor.email}` : t('Unassigned')),
              t('active {date}', { date: lastActive }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
            {s.flags.slice(0, 4).map((f) => (
              <span key={f.key} className={`pill ${f.severity === 'bad' ? 'band-hard-reach' : 'band-reach'}`}>{t(FLAG_TEXT[f.key] || f.label)}</span>
            ))}
            {s.flags.length === 0 && <span className="pill band-safety">{t('No red flags')}</span>}
          </div>
        </div>
      </Link>
      <div className="roster-steps">
        <div className="sub-title">{t('Talk about next')}</div>
        {s.steps.map((st, i) => (
          <div key={i} style={{ fontSize: 13, marginTop: 4, lineHeight: 1.45 }}>→ {t(st.text, st.vars)}</div>
        ))}
      </div>
      <div style={{ textAlign: 'right', minWidth: 70 }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{s.completeness}%</div>
        <div className="muted" style={{ fontSize: 12 }}>{t('complete')}</div>
        {isAdmin &&
          (confirm ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-danger btn-sm" onClick={() => removeMember(org.id, r.uid).catch(() => {})}>{t('Remove')}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>×</button>
            </div>
          ) : (
            <button className="roster-remove" onClick={() => setConfirm(true)}>{t('Remove')}</button>
          ))}
      </div>
      <style>{`
        .roster-row{padding:16px; display:flex; gap:18px; align-items:center; flex-wrap:wrap;}
        .roster-main{display:flex; gap:14px; align-items:center; flex:2 1 280px; min-width:0;}
        .roster-main:hover > div > div:first-child{color:var(--primary-600);}
        .roster-steps{flex:1 1 220px; min-width:0;}
        .roster-remove{background:none; border:0; color:var(--faint); font-size:12px; cursor:pointer; margin-top:6px; padding:0;}
        .roster-remove:hover{color:var(--bad);}
      `}</style>
    </div>
  );
}
