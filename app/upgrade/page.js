'use client';

// Upgrade page — the checkout front door.
//
// With NEXT_PUBLIC_CHECKOUT_*_URL set, paid buttons open the provider's hosted
// checkout with the signed-in email prefilled; the billing webhook
// (app/api/webhooks/billing) activates the plan within a minute of payment.
// Without those env vars this degrades to the manual concierge flow — the
// founder activates plans by hand in /admin/orgs.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PricingCards from '@/components/Pricing';
import { useEffectivePlan } from '@/lib/account';
import { billingEnabled, checkoutUrl, BILLING_CONTACT } from '@/lib/billing';
import { track } from '@/lib/analytics';

export default function UpgradePage() {
  const { user, ready, profile, org, isPro } = useEffectivePlan();
  // Read query params without useSearchParams to keep the page fully static
  // (no Suspense boundary needed).
  const [wanted, setWanted] = useState(null);
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setWanted(q.get('plan'));
    setPaid(q.get('success') === '1');
  }, []);

  const orgPlan = org?.plan || null;

  return (
    <div className="wrap" style={{ padding: '48px 24px 100px' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <span className="pill pill-gold">Folio Premium</span>
        <h1 style={{ fontSize: 'clamp(30px,4.4vw,44px)', marginTop: 16 }}>
          Go deeper when you’re ready.
        </h1>
        <p className="muted" style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.6 }}>
          The builder, honest chances and AI review are free forever. Pro adds your
          personal AI counselor and essay coach; Business adds the whole cockpit for
          schools and counselors.
        </p>
      </div>

      {paid && (
        <div
          className="card card-pad fade-in"
          style={{ marginTop: 28, maxWidth: 560, marginInline: 'auto', textAlign: 'center', borderColor: 'var(--good)', background: 'var(--good-tint)' }}
        >
          <div style={{ fontSize: 26 }}>🎉</div>
          <h3 style={{ fontSize: 19, marginTop: 8 }}>Payment received — activating…</h3>
          <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Your plan switches on automatically within a couple of minutes.
            {isPro
              ? ' It’s live — enjoy!'
              : ' Refresh this page shortly; if nothing changes in 10 minutes, write to us and we’ll fix it on the spot.'}
          </p>
          <Link href="/portfolio" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>
            Back to my portfolio →
          </Link>
        </div>
      )}

      <PricingCards currentPlan={ready ? profile?.plan || 'free' : null} orgPlan={orgPlan} />

      <CheckoutPanel user={user} ready={ready} wanted={wanted} isPro={isPro} orgPlan={orgPlan} />
    </div>
  );
}

function CheckoutPanel({ user, ready, wanted, isPro, orgPlan }) {
  const plan = wanted === 'business' ? 'business' : 'pro';
  const online = billingEnabled(plan);
  const alreadyOn = plan === 'pro' ? isPro : orgPlan === 'business';

  if (alreadyOn) return null;

  return (
    <div
      className="card card-pad"
      style={{
        marginTop: 36,
        maxWidth: 640,
        marginInline: 'auto',
        textAlign: 'center',
        borderColor: 'var(--accent)',
        background: 'var(--accent-tint)',
      }}
    >
      <h3 style={{ fontSize: 18 }}>
        {plan === 'business' ? 'Activate Business for your workspace' : 'Get Folio Pro'}
      </h3>

      {online ? (
        <>
          <p style={{ fontSize: 14.5, marginTop: 10, lineHeight: 1.6 }}>
            Secure card checkout — your plan activates automatically right after
            payment.{' '}
            {user
              ? <>Pay with <b>{user.email}</b> (pre-filled) so we can match it to your account.</>
              : 'Sign in first so the payment lands on your account.'}
          </p>
          {user ? (
            <a
              href={checkoutUrl(plan, user.email)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold"
              style={{ marginTop: 16 }}
              onClick={() => track('checkout_open', { plan })}
            >
              {plan === 'business' ? 'Pay & activate Business →' : 'Pay & activate Pro →'}
            </a>
          ) : (
            <Link href="/login" className="btn btn-primary" style={{ marginTop: 16 }}>
              Sign in to continue
            </Link>
          )}
          <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
            Trouble paying? Write to{' '}
            <a href={`mailto:${BILLING_CONTACT}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {BILLING_CONTACT}
            </a>{' '}
            — we also take local methods (Kaspi) and activate the same day.
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 14.5, marginTop: 10, lineHeight: 1.6 }}>
            Online card payments are almost here. Until then we onboard upgrades
            personally — write to us (Kaspi или карта), and we’ll activate your plan
            the same day.
          </p>
          <a
            href={`mailto:${BILLING_CONTACT}?subject=Folio%20${plan === 'business' ? 'Business' : 'Pro'}%20upgrade`}
            className="btn btn-gold"
            style={{ marginTop: 16 }}
            onClick={() => track('upgrade_contact', { plan })}
          >
            Write to us → {BILLING_CONTACT}
          </a>
          {!ready ? null : !user && (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
              Tip: <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>sign in</Link>{' '}
              first and mention your Google email — that’s where the plan gets activated.
            </p>
          )}
        </>
      )}
    </div>
  );
}
