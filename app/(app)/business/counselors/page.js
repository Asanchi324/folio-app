'use client';

// Workspace → Counselors. The staff roster: who's in, the mentor invite code,
// removal (admins only).

import { useState } from 'react';
import { useWorkspace } from '@/lib/workspace';
import { removeMember } from '@/lib/org';
import { PageHead, CopyChip, EmptyCard } from '../ui';

export default function CounselorsPage() {
  const { t } = useT();
  const { user, org, staff, isAdmin } = useWorkspace();
  const [err, setErr] = useState('');
  const [busyUid, setBusyUid] = useState(null);

  async function remove(m) {
    if (!confirm(t('Remove {name} from the workspace?', { name: m.displayName || m.email || t('this counselor') }))) return;
    setErr('');
    setBusyUid(m.uid);
    try {
      await removeMember(org.id, m.uid);
    } catch (e) {
      setErr(t('Could not remove the member.'));
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <>
      <PageHead
        title={t('Counselors ({n})', { n: staff.length })}
        sub={t('Everyone on your team sees the roster, opens student portfolios read-only, and leaves comments students see in their portfolio.')}
      />

      <div className="card card-pad" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="sub-title">
            {t('Invite counselors')}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 21, letterSpacing: '0.04em' }}>{org?.counselorCode}</span>
            <CopyChip value={org?.counselorCode || ''} label={t('Copy code')} />
            <CopyChip
              value={typeof window !== 'undefined' ? `${window.location.origin}/join/${org?.counselorCode}` : ''}
              label={t('Copy link')}
            />
          </div>
        </div>
        <p className="muted" style={{ fontSize: 12.5, maxWidth: 300, lineHeight: 1.55 }}>
          {t('The counselor code is separate from the student code — a student can never join as staff by accident.')}
        </p>
      </div>

      {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 14 }}>{err}</p>}

      <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
        {!staff.length && (
          <EmptyCard
            icon="users"
            title={t('Just you so far')}
            body={t('Share the counselor code with colleagues — they see the same roster and can split the cohort between them.')}
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
                {m.displayName || m.email || t('Counselor')}
                {m.uid === user?.uid && <span className="muted" style={{ fontWeight: 500 }}> · {t('you')}</span>}
              </div>
              <div className="muted" style={{ fontSize: 12.5 }}>{m.email}</div>
            </div>
            <span className={`pill ${m.role === 'orgAdmin' ? 'pill-gold' : 'pill-muted'}`} style={{ fontSize: 11 }}>
              {m.role === 'orgAdmin' ? t('Admin') : t('Counselor')}
            </span>
            {isAdmin && m.uid !== user?.uid && m.role !== 'orgAdmin' && (
              <button className="btn btn-ghost btn-sm" disabled={busyUid === m.uid} onClick={() => remove(m)}>
                {busyUid === m.uid ? t('Removing…') : t('Remove')}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
