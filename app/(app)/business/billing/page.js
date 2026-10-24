'use client';

// Workspace → Billing. Subscribe (Stripe Checkout), manage (Stripe Billing
// Portal: switch plan, update card, download invoices, cancel). Plans flip in
// Firestore automatically via the webhook — no manual steps anywhere.

import { useState } from 'react';
import { useWorkspace } from '@/lib/workspace';
import { PLANS, orgPlanLabel } from '@/lib/plans';
import { startCheckout, openBillingPortal, contactHref, BILLING_CONTACT } from '@/lib/billing';
import { PageHead, EmptyCard } from '../ui';
import { useT } from '@/lib/i18n';

export default function BillingPage() {
  const { t } = useT();
  const { org, students, paid, seatLimit, isAdmin } = useWorkspace();
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [fallback, setFallback] = useState(false);

  async function buy(planId) {
    setErr('');
    setBusy(planId);
    try {
      await startCheckout(planId);
    } catch (e) {
      if (e?.status === 501) setFallback(true);
      else setErr(t(e?.message || 'Checkout failed — try again.'));
      setBusy('');
    }
  }

  async function portal() {
    setErr('');
    setBusy('portal');
    try {
      await openBillingPortal();
    } catch (e) {
      if (e?.status === 501 || e?.status === 404) setFallback(true);
      else setErr(t(e?.message || 'Could not open the billing portal.'));
      setBusy('');
    }
  }

  if (!isAdmin) {
    return (
      <>
        <PageHead title={t('Billing')} />
        <EmptyCard
          icon="card"
          title={t('Admins only')}
          body={t('Billing is managed by the workspace owner. Ask them if you need the plan changed.')}
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title={t('Billing')}
        sub={t('Card checkout via Dodo Payments. The plan activates automatically as soon as payment completes, and every connected student gets Pro.')}
      />

      {/* current state */}
      <div className="card card-pad" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="sub-title">{t('Current plan')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 26 }}>{t(orgPlanLabel(org?.plan))}</span>
            {paid && <span className="pill band-safety">{t(org?.subscriptionStatus === 'past_due' ? 'Payment failed' : 'Active')}</span>}
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            {t('{used} of {limit} student seats used', { used: students.length, limit: seatLimit })}
            {paid
              ? ` · ${PLANS[org.plan]?.price.label}${t(PLANS[org.plan]?.price.period)}`
              : ` · ${t('trial — up to 3 students; choose a plan for more seats and Pro for every student')}`}
          </p>
        </div>
        {paid && (
          <button className="btn btn-primary" disabled={busy === 'portal'} onClick={portal}>
            {busy === 'portal' ? t('Opening…') : t('Manage subscription')}
          </button>
        )}
      </div>

      {paid ? (
        <p className="muted" style={{ fontSize: 13.5, marginTop: 14, lineHeight: 1.6, maxWidth: 620 }}>
          {t('The Dodo Payments portal handles everything: switch between Business and Business Plus (prorated automatically), update the card, download invoices, or cancel. Your plan and seats update here within a minute.')}
        </p>
      ) : (
        <>
          <div className="bl-grid" style={{ marginTop: 24 }}>
            {['business', 'businessPlus'].map((id) => {
              const plan = PLANS[id];
              const featured = id === 'business';
              return (
                <div key={id} className={`card bl-card${featured ? ' featured' : ''}`}>
                  {featured && <span className="bl-badge">{t('Most schools start here')}</span>}
                  <h3 style={{ fontSize: 19 }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 10 }}>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 36, letterSpacing: '-0.02em' }}>{plan.price.label}</span>
                    <span className="muted" style={{ fontSize: 14 }}>{t(plan.price.period)}</span>
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>{t(plan.price.note)}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'grid', gap: 8, flex: 1 }}>
                    {plan.bullets.map((b) => (
                      <li key={b} style={{ display: 'flex', gap: 8, fontSize: 13.5, lineHeight: 1.45 }}>
                        <span style={{ color: 'var(--good)', fontWeight: 800 }}>✓</span>
                        <span>{t(b)}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={featured ? 'btn btn-gold' : 'btn btn-primary'}
                    style={{ marginTop: 18, width: '100%' }}
                    disabled={Boolean(busy)}
                    onClick={() => buy(id)}
                  >
                    {busy === id ? t('Opening checkout…') : t('Subscribe to {plan}', { plan: plan.name })}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 14, textAlign: 'center' }}>
            {t('Secure checkout by Dodo Payments · cancel anytime · invoices in the billing portal')}
          </p>
        </>
      )}

      {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 16 }}>{err}</p>}
      {fallback && (
        <div className="card card-pad" style={{ marginTop: 18, borderColor: 'var(--accent)', background: 'var(--accent-tint)' }}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            {t('Online checkout is not available on this deployment yet — we set up workspaces personally instead. Write to')}{' '}
            <a href={contactHref(org?.plan === 'free' ? 'business' : org?.plan)} style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {BILLING_CONTACT}
            </a>{' '}
            {t('(card or Kaspi) and we will activate your plan the same day.')}
          </p>
        </div>
      )}

      <style>{`
        .bl-grid{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:18px; align-items:stretch;}
        .bl-card{position:relative; padding:26px; display:flex; flex-direction:column;}
        .bl-card.featured{border-color:var(--ink-2);}
        .bl-badge{position:absolute; top:-11px; left:22px; background:var(--ink); color:#fff;
          font-size:11.5px; font-weight:600; padding:3px 10px; border-radius:6px; white-space:nowrap;}
        @media (max-width:860px){.bl-grid{grid-template-columns:minmax(0,1fr);}}
      `}</style>
    </>
  );
}
