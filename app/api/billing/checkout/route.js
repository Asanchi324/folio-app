// Create a Stripe Checkout Session for a subscription and return its URL.
//
// The session carries `uid` + `plan` in metadata (on both the session and the
// subscription), so the webhook activates the exact account that clicked Buy —
// no email guessing. Anonymous users are told to sign in first.
//
// Answers 501 when Stripe env isn't configured — the client then falls back
// to the concierge (mailto) flow.

import { NextResponse } from 'next/server';
import { resolveAccess } from '@/lib/plan-server';
import { stripeConfigured, stripePost, siteOrigin, STRIPE_PRICES } from '@/lib/stripe-server';
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
  if (!stripeConfigured(plan)) {
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
