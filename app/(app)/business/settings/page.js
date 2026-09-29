'use client';

// Workspace → Settings. Profile (name, type, cohort label), white-label brand
// (paid), how the team works (automatic assignment of new students, when a
// student counts as "quiet"), invite codes, and a full data export.
// Rules limit admin writes to name/type/brandName/settings.

import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useWorkspace, rosterCsv } from '@/lib/workspace';
import { useT } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { PageHead, CopyChip, EmptyCard, LockedNote } from '../ui';

const QUIET_OPTIONS = [7, 14, 21, 30];

export default function SettingsPage() {
  const { t } = useT();
  const { org, isAdmin, paid, rows, staff } = useWorkspace();
  const [form, setForm] = useState({ name: '', type: 'practice', brandName: '', cohort: '', autoAssign: false, quietDays: 14 });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!org) return;
    const s = org.settings || {};
    setForm({
      name: org.name || '',
      type: org.type || 'practice',
      brandName: org.brandName || '',
      cohort: s.cohort || '',
      autoAssign: Boolean(s.autoAssign),
      quietDays: Number(s.quietDays) || 14,
    });
  }, [org]);

  async function save() {
    const db = getDb();
    if (!db || !org) return;
    setErr('');
    setBusy(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, 'orgs', org.id), {
        name: form.name.trim() || org.name,
        type: form.type,
        ...(paid ? { brandName: form.brandName.trim() } : {}),
        settings: {
          cohort: form.cohort.trim().slice(0, 60),
          autoAssign: form.autoAssign,
          quietDays: form.quietDays,
        },
      });
      track('workspace_settings_saved', { autoAssign: form.autoAssign });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      setErr(t('Could not save. If this keeps happening, the Firestore rules need to be republished.'));
    } finally {
      setBusy(false);
    }
  }

  function exportAll() {
    const blob = new Blob([rosterCsv(rows, staff)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `folio-workspace-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    track('cohort_csv_export', { from: 'settings' });
  }

  if (!isAdmin) {
    return (
      <>
        <PageHead title={t('Workspace settings')} />
        <EmptyCard icon="settings" title={t('Admins only')} body={t('Workspace settings are managed by the owner.')} />
      </>
    );
  }

  return (
    <>
      <PageHead title={t('Workspace settings')} sub={t('How your workspace looks to students and how your team works.')} />

      <div className="st-grid">
        <section className="card card-pad">
          <h2 style={{ fontSize: 17 }}>{t('Profile')}</h2>
          <label className="field">
            <span className="field-label">{t('Workspace name')}</span>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Aida’s Admissions Studio" />
          </label>
          <label className="field">
            <span className="field-label">{t('Type')}</span>
            <select value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="practice">{t('Independent counselor / consultancy')}</option>
              <option value="school">{t('School')}</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">
              {t('Cohort label')} <span className="field-hint">· {t('e.g. Class of 2027 — shown in the workspace header')}</span>
            </span>
            <input value={form.cohort} onChange={(e) => set('cohort', e.target.value)} placeholder={t('Class of 2027')} maxLength={60} />
          </label>
          <label className="field">
            <span className="field-label">
              {t('White-label brand name')} <span className="field-hint">· {t('shown as “Presented by …” on shared portfolios and PDFs')}</span>
            </span>
            <input value={form.brandName} onChange={(e) => set('brandName', e.target.value)} placeholder={form.name || t('Your brand')} disabled={!paid} />
          </label>
          {!paid && <LockedNote>{t('White-label branding is included in paid plans.')}</LockedNote>}
        </section>

        <section className="card card-pad">
          <h2 style={{ fontSize: 17 }}>{t('Team workflow')}</h2>
          <label className="st-toggle">
            <input type="checkbox" checked={form.autoAssign} onChange={(e) => set('autoAssign', e.target.checked)} />
            <span>
              <b>{t('Assign new students automatically')}</b>
              <small>{t('Each new student goes to the counselor with the fewest students. You can always reassign by hand.')}</small>
            </span>
          </label>
          <label className="field" style={{ marginTop: 18 }}>
            <span className="field-label">{t('A student counts as “quiet” after')}</span>
            <select value={form.quietDays} onChange={(e) => set('quietDays', Number(e.target.value))}>
              {QUIET_OPTIONS.map((d) => (
                <option key={d} value={d}>{t('{n} days without an update', { n: d })}</option>
              ))}
            </select>
          </label>
          <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
            {t('Used by Analytics and the Counselors page to flag students who need a nudge.')}
          </p>
        </section>
      </div>

      {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 14 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
        <button className="btn btn-primary" disabled={busy} onClick={save}>
          {busy ? t('Saving…') : t('Save changes')}
        </button>
        {saved && <span style={{ color: 'var(--good)', fontSize: 13.5, fontWeight: 600 }} className="fade-in">{t('Saved')}</span>}
      </div>

      <div className="st-grid" style={{ marginTop: 22 }}>
        <section className="card card-pad">
          <h2 style={{ fontSize: 17 }}>{t('Invite codes')}</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="muted" style={{ fontSize: 13, width: 90 }}>{t('Students')}</span>
              <b style={{ fontFamily: 'var(--display)', letterSpacing: '0.04em' }}>{org?.joinCode}</b>
              <CopyChip value={org?.joinCode || ''} />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="muted" style={{ fontSize: 13, width: 90 }}>{t('Counselors')}</span>
              <b style={{ fontFamily: 'var(--display)', letterSpacing: '0.04em' }}>{org?.counselorCode}</b>
              <CopyChip value={org?.counselorCode || ''} />
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <h2 style={{ fontSize: 17 }}>{t('Your data')}</h2>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>
            {t('One CSV with every student: counselor, strength, tests, school list, gaps and next steps.')}
          </p>
          {paid ? (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={exportAll} disabled={!rows.length}>
              {t('Export CSV')}
            </button>
          ) : (
            <div style={{ marginTop: 12 }}>
              <LockedNote>{t('CSV export is included in paid plans.')}</LockedNote>
            </div>
          )}
        </section>
      </div>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 18, maxWidth: 620, lineHeight: 1.6 }}>
        {t('Students always see that your workspace can view their portfolio, and can disconnect at any time — that choice is theirs, by design.')}
      </p>

      <style>{`
        .st-grid{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:18px; align-items:start;}
        .st-toggle{display:flex; gap:12px; align-items:flex-start; margin-top:14px; cursor:pointer;}
        .st-toggle input{width:18px; height:18px; margin-top:2px; flex-shrink:0;}
        .st-toggle b{display:block; font-size:14.5px;}
        .st-toggle small{display:block; font-size:12.5px; color:var(--muted); line-height:1.5; margin-top:3px;}
        @media (max-width:860px){.st-grid{grid-template-columns:minmax(0,1fr);}}
      `}</style>
    </>
  );
}
