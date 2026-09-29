'use client';

// Shown across the app when a school/counselor has invited this student by
// email. Accepting is an explicit, informed choice — the banner says exactly
// what the workspace will be able to see.

import { useState } from 'react';
import { useAccount } from '@/lib/account';
import { useMyInvites, joinOrg, revokeInvite } from '@/lib/org';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';

export default function InviteBanner() {
  const { user, profile } = useAccount();
  const invites = useMyInvites(user);
  const { t } = useT();
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');

  const pending = invites.filter((i) => i.orgId !== profile?.orgId);
  if (!user || !pending.length) return null;
  const inv = pending[0];

  async function accept() {
    setBusy('accept');
    setErr('');
    try {
      await joinOrg(user, { orgId: inv.orgId, orgName: inv.orgName, role: 'student', inviteId: inv.id }, profile?.orgId || null);
      track('org_joined', { role: 'student', via: 'email_invite' });
    } catch (e) {
      setErr(t('Could not connect. Ask your counselor to send the invite again.'));
    } finally {
      setBusy(null);
    }
  }

  async function decline() {
    setBusy('decline');
    await revokeInvite(inv.id).catch(() => {});
    setBusy(null);
  }

  return (
    <div className="invite-banner" role="region" aria-label={t('Invitation')}>
      <Icon name="mail" size={20} style={{ color: 'var(--primary-600)', marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <b>{t('{org} invited you to connect your portfolio', { org: inv.orgName || t('A school') })}</b>
        <p>
          {t('Their counselors will see your portfolio (read-only) and can leave comments. You can disconnect at any time in Settings.')}
        </p>
        {profile?.orgId && <p style={{ color: 'var(--warn)' }}>{t('This will replace your current workspace connection.')}</p>}
        {err && <p className="error-text">{err}</p>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={decline} disabled={!!busy}>
          {t('Decline')}
        </button>
        <button className="btn btn-primary btn-sm" onClick={accept} disabled={!!busy}>
          {busy === 'accept' ? t('Connecting…') : t('Accept')}
        </button>
      </div>
      <style>{`
        .invite-banner{display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;
          margin:16px 32px 0; padding:14px 16px; border:1px solid #cfe0f6; background:var(--primary-tint);
          border-radius:var(--r-lg); font-size:14px; line-height:1.5;}
        .invite-banner p{color:var(--ink-2); margin-top:4px; font-size:13.5px;}
        @media (max-width:900px){ .invite-banner{margin:12px 16px 0;} }
      `}</style>
    </div>
  );
}
