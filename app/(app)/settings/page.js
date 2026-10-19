'use client';

// Settings: language, account, plan & billing, school connection, privacy
// (analytics choice, data export, data deletion).

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { getDb, getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { usePortfolio } from '@/lib/store';
import { useEffectivePlan } from '@/lib/account';
import { signInWithGoogle, signOut } from '@/lib/auth';
import { openBillingPortal } from '@/lib/billing';
import { unpublishShare } from '@/lib/share';
import { leaveOrg } from '@/lib/org';
import { useT } from '@/lib/i18n';
import { resetConsent } from '@/components/Analytics';
import LangSwitch from '@/components/LangSwitch';
import MentorCard from '@/components/MentorCard';
import { PageHead, Loading } from '@/components/ui';

export default function SettingsPage() {
  const { t, locale } = useT();
  const router = useRouter();
  const [p, , ready, meta] = usePortfolio();
  const { user, profile, plan, org } = useEffectivePlan();
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!ready) return <Loading />;

  const ownPro = profile?.plan === 'pro';
  const viaOrg = plan === 'pro' && !ownPro;
  const periodEnd = profile?.currentPeriodEnd ? new Date(profile.currentPeriodEnd).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  async function portal() {
    setBusy('portal');
    setErr('');
    try {
      await openBillingPortal('settings');
    } catch (e) {
      setErr(t(e.message));
      setBusy('');
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), portfolio: p }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `folio-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function deleteEverything() {
    setBusy('delete');
    setErr('');
    try {
      const db = getDb();
      if (db && user) {
        if (meta?.shareId) await unpublishShare(user, meta.shareId).catch(() => {});
        if (meta?.orgId) await leaveOrg(user, meta.orgId).catch(() => {});
        await deleteDoc(doc(db, 'portfolios', user.uid, 'chat', 'main')).catch(() => {});
        await deleteDoc(doc(db, 'portfolios', user.uid));
      }
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('folio:'))
          .forEach((k) => localStorage.removeItem(k));
      } catch {}
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (e) {
          // Google requires a recent sign-in to delete the login itself. The
          // data is already gone; sign out and explain.
          if (e?.code === 'auth/requires-recent-login') await signOut();
        }
      }
      router.replace('/?deleted=1');
    } catch (e) {
      setErr(t('Could not delete everything — try again, or contact us and we will do it by hand.'));
      setBusy('');
    }
  }

  return (
    <div className="page page-narrow">
      <PageHead title={t('Settings')} />
      <div style={{ display: 'grid', gap: 18 }}>
        <section className="card card-pad">
          <h2 style={{ fontSize: 19 }}>{t('Language')}</h2>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
            {t('Interface and AI answers. Activity rewrites stay in English, because applications are submitted in English.')}
          </p>
          <div style={{ marginTop: 12 }}>
            <LangSwitch />
          </div>
        </section>

        {isFirebaseConfigured() && (
          <section className="card card-pad">
            <h2 style={{ fontSize: 19 }}>{t('Account')}</h2>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600 }}>{user.displayName || user.email}</div>
                  <div className="muted" style={{ fontSize: 13.5 }}>{user.email}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={signOut}>{t('Sign out')}</button>
              </div>
            ) : (
              <>
                <p className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.55 }}>
                  {t('Your portfolio is saved on this device only. Sign in to keep it safe and use it on any device.')}
                </p>
                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => signInWithGoogle().catch(() => {})}>
                  {t('Continue with Google')}
                </button>
                <Link href={`/login?next=${encodeURIComponent('/settings')}`} className="link" style={{ display: 'block', marginTop: 10, fontSize: 13.5 }}>
                  {t('or sign in with email')}
                </Link>
              </>
            )}
          </section>
        )}

        <section className="card card-pad">
          <h2 style={{ fontSize: 19 }}>{t('Plan')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <span className={`pill ${plan === 'pro' ? 'pill-gold' : 'pill-muted'}`}>{plan === 'pro' ? 'Pro' : t('Free')}</span>
            <span className="muted" style={{ fontSize: 14 }}>
              {viaOrg
                ? t('Included with {org}', { org: org?.name || t('your school') })
                : ownPro && profile?.cancelAtPeriodEnd && periodEnd
                  ? t('Cancelled — Pro stays active until {date}', { date: periodEnd })
                  : ownPro && periodEnd
                    ? t('Renews on {date}', { date: periodEnd })
                    : ownPro && profile?.founder
                      ? t('Founder account')
                      : null}
            </span>
          </div>
          {profile?.subscriptionStatus === 'past_due' && (
            <div className="notice notice-warn" style={{ marginTop: 12 }}>
              {t('Your last payment failed. Update your card to keep Pro — Stripe will retry automatically.')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {ownPro && profile?.stripeCustomerId ? (
              <button className="btn btn-ghost" onClick={portal} disabled={busy === 'portal'}>
                {busy === 'portal' ? t('Opening…') : t('Manage subscription')}
              </button>
            ) : plan !== 'pro' ? (
              <Link href="/upgrade?plan=pro" className="btn btn-gold">{t('Upgrade to Pro')}</Link>
            ) : null}
          </div>
        </section>

        <MentorCard meta={meta} />

        <section className="card card-pad">
          <h2 style={{ fontSize: 19 }}>{t('Privacy & data')}</h2>
          <div className="set-rows">
            <div className="set-row">
              <div>
                <b>{t('Analytics cookie')}</b>
                <p className="muted">{t('Change your choice about the optional analytics cookie.')}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={resetConsent}>{t('Change')}</button>
            </div>
            <div className="set-row">
              <div>
                <b>{t('Download my data')}</b>
                <p className="muted">{t('Your whole portfolio as a JSON file.')}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={exportData}>{t('Download')}</button>
            </div>
            <div className="set-row">
              <div>
                <b>{t('Delete my portfolio and account')}</b>
                <p className="muted">{t('Removes your portfolio, AI chat history, public link and school connection. This cannot be undone.')}</p>
              </div>
              {!confirmDelete ? (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)' }} onClick={() => setConfirmDelete(true)}>
                  {t('Delete…')}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-danger btn-sm" onClick={deleteEverything} disabled={busy === 'delete'}>
                    {busy === 'delete' ? t('Deleting…') : t('Yes, delete everything')}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>{t('Cancel')}</button>
                </div>
              )}
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            <Link href="/privacy" className="link">{t('Privacy policy')}</Link>
          </p>
        </section>
        {err && <p className="error-text">{err}</p>}
      </div>
      <style>{`
        .set-rows{display:grid; margin-top:8px;}
        .set-row{display:flex; gap:14px; align-items:center; justify-content:space-between; padding:14px 0; border-bottom:1px solid var(--line); flex-wrap:wrap;}
        .set-row:last-child{border-bottom:0;}
        .set-row > div:first-child{flex:1 1 260px;}
        .set-row b{font-size:14.5px;}
        .set-row p{font-size:13.5px; margin-top:2px; line-height:1.5;}
      `}</style>
    </div>
  );
}
