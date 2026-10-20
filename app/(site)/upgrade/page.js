'use client';

// Upgrade — the checkout front door. Selecting a paid plan creates a Stripe
// Checkout Session (/api/billing/checkout) and redirects; the webhook flips
// the plan in Firestore automatically after payment. Signed-out visitors are
// asked to sign in first so the purchase lands on their account.
//
// Degradation: without Stripe env the API answers 501 and this page falls
// back to the concierge flow (write to us — Kaspi/card, same-day activation).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PricingCards from '@/components/Pricing';
import { useEffectivePlan } from '@/lib/account';
import { startCheckout, openBillingPortal, contactHref, BILLING_CONTACT } from '@/lib/billing';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { ORG_PLAN_IDS } from '@/lib/plans';
import { track } from '@/lib/analytics';
import { apiPost } from '@/lib/auth';
import { useT } from '@/lib/i18n';

export default function UpgradePage() {
  const router = useRouter();
  const { t } = useT();
  const { user, ready, profile, org, isPro } = useEffectivePlan();
  // Read query params without useSearchParams to keep the page fully static
  // (no Suspense boundary needed).
  const [wanted, setWanted] = useState(null);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [needSignIn, setNeedSignIn] = useState(false);
  const [fallbackPlan, setFallbackPlan] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setWanted(q.get('plan'));
    setPaid(q.get('success') === '1');
  }, []);

  // Back from Stripe: confirm the session server-side so Pro switches on right
  // away, even if the webhook is slow. Idempotent — the webhook may also apply it.
  useEffect(() => {
    if (!paid || !user) return;
    const sid = new URLSearchParams(window.location.search).get('session_id');
    if (!sid) return;
    apiPost('/api/billing/confirm', { sessionId: sid }).catch(() => {});
  }, [paid, user]);

  const orgPlan = org?.plan || null;
  const hasSubscription = Boolean(profile?.stripeCustomerId || org?.stripeCustomerId);

  async function select(planId) {
    setErr('');
    setFallbackPlan(null);
    if (!user) {
      setNeedSignIn(true);
      track('checkout_needs_signin', { plan: planId });
      return;
    }
    // Workspace plans for existing workspace owners are managed in /business.
    if (ORG_PLAN_IDS.includes(planId) && profile?.orgId && ORG_PLAN_IDS.includes(orgPlan)) {
      router.push('/business/billing');
      return;
    }
    setBusy(true);
    try {
      await startCheckout(planId);
    } catch (e) {
      if (e?.status === 501) setFallbackPlan(planId);
      else if (e?.status === 401) setNeedSignIn(true);
      else setErr(t(e?.message || 'Checkout failed — try again.'));
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ paddingTop: 48, paddingBottom: 100 }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(30px,4.4vw,44px)' }}>{t('Plans')}</h1>
        <p className="muted" style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.6 }}>
          {t('The builder, honest chances and AI review are free. Pro adds the AI counselor and essay coach; workspace plans are for schools and counselors.')}
        </p>
      </div>

      {paid && (
        <div
          className="card card-pad fade-in"
          style={{ marginTop: 28, maxWidth: 560, marginInline: 'auto', textAlign: 'center', borderColor: 'var(--good)', background: 'var(--good-tint)' }}
        >
          <h3 style={{ fontSize: 19 }}>
            {isPro ? t('Pro is active') : t('Payment received — activating…')}
          </h3>
          <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            {isPro
              ? t('The essay coach and AI counselor are unlocked.')
              : t('Your plan switches on automatically within a minute. If nothing changes in 10 minutes, write to us and we will fix it right away.')}
          </p>
          <Link href="/portfolio" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>
            {t('Back to my portfolio')}
          </Link>
        </div>
      )}

      {needSignIn && !user && (
        <div
          className="card card-pad fade-in"
          style={{ marginTop: 28, maxWidth: 480, marginInline: 'auto', textAlign: 'center', borderColor: 'var(--primary)' }}
        >
          <h3 style={{ fontSize: 17 }}>{t('One step first')}</h3>
          <p className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            {t('Sign in with Google so the plan is attached to your account, then choose the plan again.')}
          </p>
          <GoogleSignInButton style={{ marginTop: 14 }} />
          <Link href={`/login?next=${encodeURIComponent('/upgrade')}`} className="link" style={{ display: 'block', marginTop: 10, fontSize: 13.5 }}>
            {t('or sign in with email')}
          </Link>
        </div>
      )}

      <PricingCards
        currentPlan={ready ? profile?.plan || 'free' : null}
        orgPlan={orgPlan}
        audience={wanted === 'business' || wanted === 'businessPlus' ? 'org' : 'student'}
        onSelect={busy ? () => {} : select}
      />

      {err && (
        <p style={{ color: 'var(--bad)', fontSize: 14, marginTop: 20, textAlign: 'center' }}>{err}</p>
      )}

      {fallbackPlan && (
        <div
          className="card card-pad fade-in"
          style={{ marginTop: 28, maxWidth: 560, marginInline: 'auto', textAlign: 'center', borderColor: 'var(--accent)', background: 'var(--accent-tint)' }}
        >
          <h3 style={{ fontSize: 17 }}>{t('We will set you up personally')}</h3>
          <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            {t('Online checkout is not live on this deployment yet. Write to us — card or Kaspi — and your plan is activated the same day.')}
          </p>
          <a href={contactHref(fallbackPlan)} className="btn btn-gold" style={{ marginTop: 14 }} onClick={() => track('upgrade_contact', { plan: fallbackPlan })}>
            {t('Write to us')} → {BILLING_CONTACT}
          </a>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 34 }}>
        {hasSubscription && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => openBillingPortal().catch((e) => setErr(t(e?.message || 'Portal unavailable.')))}
          >
            {t('Manage my subscription (invoices, card, cancel)')}
          </button>
        )}
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
          {t('Secure checkout by Stripe · cancel anytime · questions?')}{' '}
          <a href={`mailto:${BILLING_CONTACT}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
            {BILLING_CONTACT}
          </a>
        </p>
      </div>
    </div>
  );
}
