'use client';

// Workspace → Settings. Name/type, white-label brand (paid), invite codes,
// transparency notes. Writes limited by rules to name/type/brandName.

import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useWorkspace } from '@/lib/workspace';
import { PageHead, CopyChip, EmptyCard, LockedNote } from '../ui';

export default function SettingsPage() {
  const { org, isAdmin, paid } = useWorkspace();
  const [name, setName] = useState('');
  const [type, setType] = useState('practice');
  const [brandName, setBrandName] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!org) return;
    setName(org.name || '');
    setType(org.type || 'practice');
    setBrandName(org.brandName || '');
  }, [org]);

  async function save() {
    const db = getDb();
    if (!db || !org) return;
    setErr('');
    setBusy(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, 'orgs', org.id), {
        name: name.trim() || org.name,
        type,
        ...(paid ? { brandName: brandName.trim() } : {}),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setErr(e?.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <>
        <PageHead title="Settings" />
        <EmptyCard icon="⚙" title="Admins only" body="Workspace settings are managed by the owner." />
      </>
    );
  }

  return (
    <>
      <PageHead title="Settings" sub="Workspace identity and white-label branding." />

      <div className="card card-pad" style={{ maxWidth: 560 }}>
        <label className="field">
          <span className="field-label">Workspace name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aida’s Admissions Studio" />
        </label>
        <label className="field">
          <span className="field-label">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="practice">Independent counselor / consultancy</option>
            <option value="school">School</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">
            White-label brand name <span className="field-hint">· shown as “Presented by …” on shared portfolios & PDFs</span>
          </span>
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder={name || 'Your brand'}
            disabled={!paid}
          />
        </label>
        {!paid && <LockedNote>White-label branding is included in Business.</LockedNote>}

        {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 12 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span style={{ color: 'var(--good)', fontSize: 13.5, fontWeight: 600 }}>✓ Saved</span>}
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 560, marginTop: 18 }}>
        <h2 style={{ fontSize: 16 }}>Invite codes</h2>
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 13, width: 90 }}>Students</span>
            <b style={{ fontFamily: 'var(--display)', letterSpacing: '0.04em' }}>{org?.joinCode}</b>
            <CopyChip value={org?.joinCode || ''} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 13, width: 90 }}>Counselors</span>
            <b style={{ fontFamily: 'var(--display)', letterSpacing: '0.04em' }}>{org?.counselorCode}</b>
            <CopyChip value={org?.counselorCode || ''} />
          </div>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 18, maxWidth: 560, lineHeight: 1.6 }}>
        Transparency: students always see that your workspace can view their
        portfolio, and can disconnect themselves at any time — that consent
        switch is theirs, by design.
      </p>
    </>
  );
}
