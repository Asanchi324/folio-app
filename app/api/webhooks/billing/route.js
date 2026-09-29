// Stripe webhook — the source of truth that turns payments into plans.
//
// Point a Stripe webhook endpoint at /api/webhooks/billing with events:
//   checkout.session.completed      → activate the purchased plan
//   customer.subscription.updated   → plan switches (portal), renewals,
//                                     cancel-at-period-end, past_due
//   customer.subscription.deleted   → subscription ended → back to free
//   invoice.payment_failed          → logged + status shown to the customer
// (`npm run stripe:setup` creates this endpoint for you.)
//
// Matching is exact: /api/billing/checkout stamps `uid` + `plan` into the
// session AND subscription metadata. Email lookup remains as a fallback for
// payments made outside the app (e.g. a Payment Link sent by hand).
//
// Requires FIREBASE_SERVICE_ACCOUNT_JSON + STRIPE_WEBHOOK_SECRET; until both
// exist the route answers 501/503 — safe to deploy dormant.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { adminConfigured, adminLogEvent } from '@/lib/firestore-admin';
import { planForPrice, stripeGet, stripeConfigured } from '@/lib/stripe-server';
import { applyChange, subscriptionState } from '@/lib/billing-apply';

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const TOLERANCE_SEC = 5 * 60; // reject replayed events older than 5 minutes

function verifyStripeSignature(request, rawBody) {
  const header = request.headers.get('stripe-signature') || '';
  const parts = {};
  const v1 = [];
  for (const kv of header.split(',')) {
    const [k, v] = kv.split('=').map((s) => (s || '').trim());
    if (k === 'v1') v1.push(v);
    else if (k) parts[k] = v;
  }
  if (!parts.t || !v1.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > TOLERANCE_SEC) return false;
  const digest = crypto.createHmac('sha256', WEBHOOK_SECRET).update(`${parts.t}.${rawBody}`).digest('hex');
  const a = Buffer.from(digest, 'hex');
  // Stripe may send several v1 signatures during secret rotation.
  return v1.some((sig) => {
    const b = Buffer.from(sig, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

async function fetchSubscription(id) {
  if (!id || !stripeConfigured()) return null;
  try {
    return await stripeGet(`subscriptions/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

async function toChange(payload) {
  const type = payload?.type || '';
  const obj = payload?.data?.object || {};

  if (type === 'checkout.session.completed') {
    if (obj.mode && obj.mode !== 'subscription') return null;
    if (obj.payment_status && !['paid', 'no_payment_required'].includes(obj.payment_status)) return null;
    const subId = typeof obj.subscription === 'string' ? obj.subscription : obj.subscription?.id || null;
    const sub = await fetchSubscription(subId);
    const state = subscriptionState(sub) || { action: 'grant', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false };
    return {
      ...state,
      plan: obj.metadata?.plan || 'pro',
      uid: obj.metadata?.uid || obj.client_reference_id || null,
      email: (obj.customer_details?.email || obj.customer_email || '').toLowerCase(),
      customerId: typeof obj.customer === 'string' ? obj.customer : null,
      subscriptionId: subId,
      event: type,
    };
  }

  if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    const priceId = obj.items?.data?.[0]?.price?.id || null;
    const state =
      type === 'customer.subscription.deleted'
        ? { action: 'revoke', status: 'canceled', currentPeriodEnd: null, cancelAtPeriodEnd: false }
        : subscriptionState(obj);
    if (!state) return null;
    return {
      ...state,
      plan: planForPrice(priceId) || obj.metadata?.plan || 'pro',
      uid: obj.metadata?.uid || null,
      email: '',
      customerId: typeof obj.customer === 'string' ? obj.customer : null,
      subscriptionId: obj.id || null,
      event: type,
    };
  }

  if (type === 'invoice.payment_failed') {
    return {
      log: {
        status: 'payment_failed',
        email: (obj.customer_email || '').toLowerCase(),
        customerId: typeof obj.customer === 'string' ? obj.customer : '',
        event: type,
        note: 'Stripe retries per your dunning settings; subscription.updated carries past_due.',
      },
    };
  }
  return null;
}

export async function POST(request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Billing webhook is not configured (STRIPE_WEBHOOK_SECRET).' }, { status: 501 });
  }
  if (!adminConfigured()) {
    console.error('[billing] FIREBASE_SERVICE_ACCOUNT_JSON missing — cannot apply plan');
    return NextResponse.json({ error: 'server not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 512 * 1024 || !verifyStripeSignature(request, rawBody)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'unparseable payload' }, { status: 400 });
  }

  try {
    const change = await toChange(payload);
    if (!change) return NextResponse.json({ ok: true, ignored: payload?.type || 'event' });
    if (change.log) {
      await adminLogEvent('billing_events', change.log);
      return NextResponse.json({ ok: true, logged: true });
    }
    const result = await applyChange(change);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[billing]', e?.message);
    // 5xx → Stripe retries; nothing is lost.
    return NextResponse.json({ error: 'apply failed' }, { status: 500 });
  }
}
