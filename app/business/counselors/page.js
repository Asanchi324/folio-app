'use client';

// Workspace → Counselors. The staff roster: who's in, the mentor invite code,
// removal (admins only).

import { useState } from 'react';
import { useWorkspace } from '@/lib/workspace';
import { removeMember } from '@/lib/org';
import { PageHead, CopyChip, EmptyCard } from '../ui';

export default function CounselorsPage() {
  const { user, org, staff, isAdmin } = useWorkspace();
  const [err, setErr] = useState('');
  const [busyUid, setBusyUid] = useState(null);

  async function remove(m) {
    if (!confirm(`Remove ${m.displayName || m.email || 'this counselor'} from the workspace?`)) return;
    setErr('');
    setBusyUid(m.uid);
    try {
      await removeMember(org.id, m.uid);
    } catch (e) {
      setErr(e?.message || 'Could not remove the member.');
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <>
      <PageHead
        title={`Counselors (${staff.length})`}
        sub="Everyone on your team sees the roster, opens student portfolios read-only, and leaves comments students see in their builder."
      />

      <div className="card card-pad" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Invite counselors
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 21, letterSpacing: '0.04em' }}>{org?.counselorCode}</span>
            <CopyChip value={org?.counselorCode || ''} label="Copy code" />
            <CopyChip
              value={typeof window !== 'undefined' ? `${window.location.origin}/join/${org?.counselorCode}` : ''}
              label="Copy invite link"
            />
          </div>
        </div>
        <p className="muted" style={{ fontSize: 12.5, maxWidth: 300, lineHeight: 1.55 }}>
          The mentor code is separate from the student code — a student can
          never accidentally join as staff.
        </p>
      </div>

      {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 14 }}>{err}</p>}

      <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
        {!staff.length && (
          <EmptyCard
            icon="🧑‍🏫"
            title="Just you so far"
            body="Share the mentor code with colleagues — they'll see the same roster and can split the cohort between them."
          />
        )}
        {staff.map((m) => (
          <div key={m.uid} className="card" style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              aria-hidden
              style={{
                width: 38, height: 38, borderRadius: 999, background: 'var(--primary-tint)',
                color: 'var(--primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0,
              }}
            >
              {(m.displayName || m.email || '?')[0].toUpperCase()}
            </span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                {m.displayName || m.email || 'Counselor'}
                {m.uid === user?.uid && <span className="muted" style={{ fontWeight: 500 }}> · you</span>}
              </div>
              <div className="muted" style={{ fontSize: 12.5 }}>{m.email}</div>
            </div>
            <span className={`pill ${m.role === 'orgAdmin' ? 'pill-gold' : 'pill-muted'}`} style={{ fontSize: 11 }}>
              {m.role === 'orgAdmin' ? 'Admin' : 'Counselor'}
            </span>
            {isAdmin && m.uid !== user?.uid && m.role !== 'orgAdmin' && (
              <button className="btn btn-ghost btn-sm" disabled={busyUid === m.uid} onClick={() => remove(m)}>
                {busyUid === m.uid ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
