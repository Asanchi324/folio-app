// Dodo Payments webhook — the source of truth that turns payments into plans.
//
// Dodo dashboard → Developer → Webhooks → endpoint {SITE_URL}/api/webhooks/dodo
// with the subscription.* events (active, renewed, updated, plan_changed,
// past_due, on_hold, paused, unpaused, cancelled, expired, failed). Copy the
// signing secret into DODO_PAYMENTS_WEBHOOK_KEY.
//
// Matching is exact: /api/billing/checkout stamps `uid` + `plan` into the
// checkout metadata, which Dodo carries onto the subscription. Email lookup
// remains as a fallback (e.g. a static payment link sent by hand).
//
// Every subscription event is handled the same way: re-read the subscription
// from Dodo (events can arrive out of order) and apply its current state.
// applyChange is idempotent, so retries and duplicates are harmless.
//
// Requires FIREBASE_SERVICE_ACCOUNT_JSON + DODO_PAYMENTS_WEBHOOK_KEY; until
// both exist the route answers 501/503 — safe to deploy dormant.

import { NextResponse } from 'next/server';
import { adminConfigured, adminLogEvent } from '@/lib/firestore-admin';
import { dodo, dodoConfigured, dodoSubscriptionState, planForProduct } from '@/lib/dodo-server';
import { applyChange } from '@/lib/billing-apply';

export const runtime = 'nodejs';

const WEBHOOK_KEY = process.env.DODO_PAYMENTS_WEBHOOK_KEY;

async function latest(sub) {
  try {
    return await dodo().subscriptions.retrieve(sub.subscription_id);
  } catch {
    return sub; // the payload is a recent snapshot — good enough
  }
}

export async function POST(request) {
  if (!WEBHOOK_KEY || !dodoConfigured()) {
    return NextResponse.json({ error: 'Dodo webhook is not configured (DODO_PAYMENTS_WEBHOOK_KEY).' }, { status: 501 });
  }
  if (!adminConfigured()) {
    console.error('[dodo] FIREBASE_SERVICE_ACCOUNT_JSON missing — cannot apply plan');
    return NextResponse.json({ error: 'server not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 512 * 1024) return NextResponse.json({ error: 'too large' }, { status: 413 });

  let event;
  try {
    event = dodo().webhooks.unwrap(rawBody, {
      headers: {
        'webhook-id': request.headers.get('webhook-id') || '',
        'webhook-signature': request.headers.get('webhook-signature') || '',
        'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
      },
    });
  } catch {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  const type = event?.type || '';
  const data = event?.data || {};

  try {
    if (type.startsWith('subscription.') && data.subscription_id) {
      const sub = await latest(data);
      const state = dodoSubscriptionState(sub);
      if (!state) return NextResponse.json({ ok: true, ignored: `${type} (${sub.status})` });
      const result = await applyChange({
        ...state,
        provider: 'dodo',
        plan: planForProduct(sub.product_id) || sub.metadata?.plan || 'pro',
        uid: sub.metadata?.uid || null,
        email: (sub.customer?.email || '').toLowerCase(),
        customerId: sub.customer?.customer_id || null,
        subscriptionId: sub.subscription_id,
        event: type,
      });
      return NextResponse.json(result);
    }

    if (type === 'payment.failed') {
      await adminLogEvent('billing_events', {
        status: 'payment_failed',
        provider: 'dodo',
        email: (data.customer?.email || '').toLowerCase(),
        customerId: data.customer?.customer_id || '',
        event: type,
        note: 'Dodo retries renewals; subscription.past_due / on_hold follow.',
      });
      return NextResponse.json({ ok: true, logged: true });
    }

    return NextResponse.json({ ok: true, ignored: type || 'event' });
  } catch (e) {
    console.error('[dodo]', type, e?.message);
    // 5xx → Dodo retries; nothing is lost.
    return NextResponse.json({ error: 'apply failed' }, { status: 500 });
  }
}
