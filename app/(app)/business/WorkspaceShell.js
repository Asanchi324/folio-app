'use client';

// Business Workspace — navigation lives in the app sidebar (AppShell); this
// layout provides the workspace data + guards (signed in, in an org, staff)
// and a slim header with the plan and seat usage.
//
// `?welcome=1` (Stripe success redirect) / `?created=1` (just created) show an
// activating screen while the org doc lands — the users/{uid} snapshot flips
// everything live, no polling.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceProvider, useWorkspace } from '@/lib/workspace';
import { apiPost } from '@/lib/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { isFirebaseConfigured } from '@/lib/firebase';
import { orgPlanLabel } from '@/lib/plans';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';
import { Spinner } from '@/components/ui';

export default function BusinessLayout({ children }) {
  return (
    <WorkspaceProvider>
      <Guarded>{children}</Guarded>
    </WorkspaceProvider>
  );
}

function Guarded({ children }) {
  const { t } = useT();
  const { user, ready, org, orgId, isStaff, paid, students, seatLimit, invites } = useWorkspace();
  const [welcome, setWelcome] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setWelcome(q.get('welcome') === '1' || q.get('created') === '1');
  }, []);
  useEffect(() => {
    if (!welcome) return;
    const tm = setTimeout(() => setWelcome(false), 30000);
    return () => clearTimeout(tm);
  }, [welcome]);
  // Back from Stripe: confirm the session so the plan (and, for a first
  // purchase, the workspace itself) is applied without waiting for the webhook.
  useEffect(() => {
    if (!user) return;
    const sid = new URLSearchParams(window.location.search).get('session_id');
    if (sid) apiPost('/api/billing/confirm', { sessionId: sid }).catch(() => {});
  }, [user]);

  if (!isFirebaseConfigured()) {
    return <Centered icon="info" title={t('Accounts are not configured')}>{t('The workspace needs Firebase keys on this deployment.')}</Centered>;
  }
  if (!ready) return <Centered spinner title={t('Loading your workspace…')} />;

  if (!user) {
    return (
      <Centered icon="building" title={t('Sign in to your workspace')}>
        {t('The workspace is where schools and counselors follow their students’ portfolios.')}
        <GoogleSignInButton className="btn btn-primary btn-block" style={{ marginTop: 18 }} />
        <Link href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/business')}`} className="link" style={{ display: 'block', marginTop: 10, fontSize: 13.5 }}>
          {t('or sign in with email')}
        </Link>
      </Centered>
    );
  }

  if (!orgId) {
    if (welcome) {
      return (
        <Centered spinner title={t('Setting up your workspace…')}>
          {t('Payment received — we are creating your workspace. This takes a few seconds and the page will open by itself.')}
        </Centered>
      );
    }
    return (
      <Centered icon="building" title={t('No workspace yet')}>
        {t('Create a workspace for your school or practice. You can add up to 3 students for free to try it, then choose a plan.')}
        <Link href="/start?type=business" className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
          {t('Create a workspace')}
        </Link>
        <Link href="/upgrade?plan=business" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 10 }}>
          {t('See workspace pricing')}
        </Link>
      </Centered>
    );
  }

  if (!isStaff) {
    return (
      <Centered icon="student" title={t('This area is for workspace staff')}>
        {t('You are connected to {org} as a student — its counselors see your portfolio, and you keep building it as usual.', {
          org: org?.name || t('a workspace'),
        })}
        <Link href="/portfolio" className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
          {t('Back to my portfolio')}
        </Link>
      </Centered>
    );
  }

  const used = students.length + (invites?.length || 0);
  return (
    <div className="page">
      <div className="ws-bar">
        <div style={{ minWidth: 0 }}>
          <div className="ws-name">
            {org?.name || t('Workspace')}
            {org?.settings?.cohort && <span className="muted" style={{ fontWeight: 500 }}> · {org.settings.cohort}</span>}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            <span className={`pill ${paid ? 'pill-gold' : 'pill-muted'}`}>{t(orgPlanLabel(org?.plan))}</span>{' '}
            {t('{used} of {limit} student seats used', { used, limit: seatLimit })}
          </div>
        </div>
        <div className="ws-seatbar" aria-hidden>
          <div style={{ width: `${Math.min(100, (used / Math.max(1, seatLimit)) * 100)}%` }} />
        </div>
        {!paid && (
          <Link href="/business/billing" className="btn btn-gold btn-sm">
            {t('Choose a plan')}
          </Link>
        )}
      </div>
      {children}
      <style>{`
        .ws-bar{display:flex; align-items:center; gap:16px; flex-wrap:wrap; padding:12px 16px; margin-bottom:22px;
          border:1px solid var(--line); border-radius:var(--r-lg); background:var(--surface);}
        .ws-name{font-weight:700; font-size:15px; overflow-wrap:anywhere;}
        .ws-seatbar{flex:1 1 120px; max-width:220px; height:6px; border-radius:999px; background:var(--line); overflow:hidden; margin-left:auto;}
        .ws-seatbar div{height:100%; background:var(--primary); border-radius:999px; transition:width .4s ease;}
      `}</style>
    </div>
  );
}

function Centered({ icon, spinner, title, children }) {
  return (
    <div className="page" style={{ maxWidth: 480, paddingTop: 70 }}>
      <div className="card card-pad fade-in" style={{ textAlign: 'center' }}>
        {spinner ? <Spinner size={24} /> : <Icon name={icon} size={30} style={{ color: 'var(--faint)' }} />}
        <h1 style={{ fontSize: 23, marginTop: 12 }}>{title}</h1>
        {children && <div className="muted" style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.6 }}>{children}</div>}
      </div>
    </div>
  );
}
