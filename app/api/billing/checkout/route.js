// Create a checkout session for a subscription and return its URL. Dodo
// Payments is used when DODO_PAYMENTS_API_KEY is set; otherwise Stripe.
//
// The session carries `uid` + `plan` in metadata (on both the session and the
// subscription), so the webhook activates the exact account that clicked Buy —
// no email guessing. Anonymous users are told to sign in first.
//
// Answers 501 when neither provider is configured — the client then falls back
// to the concierge (mailto) flow.

import { NextResponse } from 'next/server';
import { resolveAccess } from '@/lib/plan-server';
import { stripeConfigured, stripePost, siteOrigin, STRIPE_PRICES } from '@/lib/stripe-server';
import { dodoConfigured, dodo, DODO_PRODUCTS } from '@/lib/dodo-server';
import { adminConfigured, adminGetDoc } from '@/lib/firestore-admin';

export const runtime = 'nodejs';

const VALID_PLANS = ['pro', 'business', 'businessPlus'];

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is fine — plan checked below */
  }
  const plan = VALID_PLANS.includes(body?.plan) ? body.plan : null;
  if (!plan) {
    return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
  }
  const useDodo = dodoConfigured(plan);
  if (!useDodo && !stripeConfigured(plan)) {
    return NextResponse.json(
      { error: 'Online checkout is not configured.', fallback: 'contact' },
      { status: 501 }
    );
  }

  const access = await resolveAccess(request);
  if (!access.uid) {
    return NextResponse.json({ error: 'Sign in first so the plan lands on your account.' }, { status: 401 });
  }

  // Already on it? Don't double-charge.
  if (plan === 'pro' && access.userPlan === 'pro') {
    return NextResponse.json({ error: 'You already have Pro.' }, { status: 409 });
  }
  if (plan !== 'pro' && access.orgPlan === plan) {
    return NextResponse.json({ error: 'Your workspace is already on this plan.' }, { status: 409 });
  }

  const origin = siteOrigin(request);
  const isOrgPlan = plan !== 'pro';

  if (useDodo) return dodoCheckout({ plan, access, origin, isOrgPlan });

  // {CHECKOUT_SESSION_ID} is filled in by Stripe; the return page posts it to
  // /api/billing/confirm so the plan activates without waiting for the webhook.
  const successUrl = isOrgPlan
    ? `${origin}/business/billing?welcome=1&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`
    : `${origin}/upgrade?success=1&plan=pro&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/upgrade?plan=${plan}`;

  // Reuse the Stripe customer when we know it (plan switches, resubscribes) so
  // the portal shows one coherent history. Best-effort: needs the admin key.
  let customerId = null;
  if (adminConfigured()) {
    try {
      const userDoc = await adminGetDoc(`users/${access.uid}`);
      customerId = userDoc?.stripeCustomerId || null;
    } catch {
      /* fall through — Stripe dedupes by email well enough */
    }
  }

  try {
    const session = await stripePost('checkout/sessions', {
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: access.uid,
      ...(customerId ? { customer: customerId } : { customer_email: access.email || undefined }),
      allow_promotion_codes: 'true',
      metadata: { uid: access.uid, plan },
      subscription_data: { metadata: { uid: access.uid, plan } },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[billing/checkout]', e?.message);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 });
  }
}

// Dodo appends ?subscription_id=…&status=… to return_url; the return page
// posts the id to /api/billing/confirm, which re-reads it from Dodo before
// granting anything (the redirect alone is never trusted).
async function dodoCheckout({ plan, access, origin, isOrgPlan }) {
  const returnUrl = isOrgPlan
    ? `${origin}/business/billing?welcome=1&plan=${plan}`
    : `${origin}/upgrade?success=1&plan=pro`;

  let customerId = null;
  if (adminConfigured()) {
    try {
      const userDoc = await adminGetDoc(`users/${access.uid}`);
      customerId = userDoc?.dodoCustomerId || null;
    } catch {
      /* fall through — Dodo matches the customer by email */
    }
  }

  try {
    const session = await dodo().checkoutSessions.create({
      product_cart: [{ product_id: DODO_PRODUCTS[plan], quantity: 1 }],
      customer: customerId ? { customer_id: customerId } : access.email ? { email: access.email } : null,
      return_url: returnUrl,
      cancel_url: `${origin}/upgrade?plan=${plan}`,
      metadata: { uid: access.uid, plan },
      // The account email is locked so the payment can always be traced back
      // to this account, even if the uid in metadata were ever lost.
      feature_flags: { allow_discount_code: true, allow_customer_editing_email: false },
    });
    if (!session.checkout_url) throw new Error('No checkout_url in Dodo response');
    return NextResponse.json({ url: session.checkout_url });
  } catch (e) {
    console.error('[billing/checkout:dodo]', e?.status || '', e?.message);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 });
  }
}
