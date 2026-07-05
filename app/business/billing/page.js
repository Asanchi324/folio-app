'use client';

// Workspace → Billing. Subscribe (Stripe Checkout), manage (Stripe Billing
// Portal: switch plan, update card, download invoices, cancel). Plans flip in
// Firestore automatically via the webhook — no manual steps anywhere.

import { useState } from 'react';
import { useWorkspace } from '@/lib/workspace';
import { PLANS, orgPlanLabel } from '@/lib/plans';
import { startCheckout, openBillingPortal, contactHref, BILLING_CONTACT } from '@/lib/billing';
import { PageHead, EmptyCard } from '../ui';

export default function BillingPage() {
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
      else setErr(e?.message || 'Checkout failed — try again.');
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
      else setErr(e?.message || 'Could not open the billing portal.');
      setBusy('');
    }
  }

  if (!isAdmin) {
    return (
      <>
        <PageHead title="Billing" />
        <EmptyCard
          icon="⬡"
          title="Admins only"
          body="Billing is managed by the workspace owner. Ask them if you need the plan changed."
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Billing"
        sub="Card checkout via Stripe. Your plan activates automatically the moment payment completes — and every connected student gets Pro instantly."
      />

      {/* current state */}
      <div className="card card-pad" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Current plan
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 26 }}>{orgPlanLabel(org?.plan)}</span>
            {paid && <span className="pill band-safety" style={{ fontSize: 11 }}>Active</span>}
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            {students.length}/{seatLimit} student seats used
            {paid ? ` · ${PLANS[org.plan]?.price.label}${PLANS[org.plan]?.price.period}` : ' · setup mode (up to 3 students to trial the workflow)'}
          </p>
        </div>
        {paid && (
          <button className="btn btn-primary" disabled={busy === 'portal'} onClick={portal}>
            {busy === 'portal' ? 'Opening…' : 'Manage subscription →'}
          </button>
        )}
      </div>

      {paid ? (
        <p className="muted" style={{ fontSize: 13.5, marginTop: 14, lineHeight: 1.6, maxWidth: 620 }}>
          The portal handles everything: switch between Business and Business
          Plus (prorated automatically), update the card, download invoices, or
          cancel — your plan and seats update here within a minute.
        </p>
      ) : (
        <>
          <div className="bl-grid" style={{ marginTop: 24 }}>
            {['business', 'businessPlus'].map((id) => {
              const plan = PLANS[id];
              const featured = id === 'business';
              return (
                <div key={id} className={`card bl-card${featured ? ' featured' : ''}`}>
                  {featured && <span className="bl-badge">Most schools start here</span>}
                  <h3 style={{ fontSize: 19 }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 10 }}>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 36, letterSpacing: '-0.02em' }}>{plan.price.label}</span>
                    <span className="muted" style={{ fontSize: 14 }}>{plan.price.period}</span>
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>{plan.price.note}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'grid', gap: 8, flex: 1 }}>
                    {plan.bullets.map((b) => (
                      <li key={b} style={{ display: 'flex', gap: 8, fontSize: 13.5, lineHeight: 1.45 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 800 }}>✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={featured ? 'btn btn-gold' : 'btn btn-primary'}
                    style={{ marginTop: 18, width: '100%' }}
                    disabled={Boolean(busy)}
                    onClick={() => buy(id)}
                  >
                    {busy === id ? 'Opening checkout…' : `Subscribe to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 14, textAlign: 'center' }}>
            Secure checkout by Stripe · cancel anytime · VAT invoices in the billing portal
          </p>
        </>
      )}

      {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 16 }}>{err}</p>}
      {fallback && (
        <div className="card card-pad" style={{ marginTop: 18, borderColor: 'var(--accent)', background: 'var(--accent-tint)' }}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Online checkout isn’t available on this deployment yet — we onboard
            workspaces personally instead. Write to{' '}
            <a href={contactHref(org?.plan === 'free' ? 'business' : org?.plan)} style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {BILLING_CONTACT}
            </a>{' '}
            (card or Kaspi) and we’ll activate your plan the same day.
          </p>
        </div>
      )}

      <style>{`
        .bl-grid{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:18px; align-items:stretch;}
        .bl-card{position:relative; padding:26px; display:flex; flex-direction:column;}
        .bl-card.featured{border-color:var(--accent); box-shadow:0 10px 34px rgba(192,138,45,0.14);}
        .bl-badge{position:absolute; top:-12px; left:24px; background:var(--accent); color:#fff;
          font-size:11px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;
          padding:4px 12px; border-radius:999px; white-space:nowrap;}
        @media (max-width:860px){.bl-grid{grid-template-columns:1fr;}}
      `}</style>
    </>
  );
}
