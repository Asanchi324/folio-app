// Payment webhook — turns a completed checkout into a plan flip in Firestore.
//
// Supported providers (detected by their signature header):
//   Lemon Squeezy — X-Signature, HMAC-SHA256(raw body) with
//                   LEMONSQUEEZY_WEBHOOK_SECRET. Point the webhook at
//                   /api/webhooks/billing with events: order_created,
//                   subscription_created / resumed / unpaused / expired.
//   Stripe        — Stripe-Signature (t=…,v1=…), HMAC-SHA256(`${t}.${body}`)
//                   with STRIPE_WEBHOOK_SECRET. Event: checkout.session.completed.
//                   (Cancellations: handle manually or extend below.)
//
// Matching: the buyer pays with the SAME email they use to sign in to Folio
// (the /upgrade page prefills it). We look up users/{uid} by email and set
// `plan`. A Business purchase flips the buyer's own workspace (orgs where
// ownerUid == uid) to the business plan instead.
//
// Requires FIREBASE_SERVICE_ACCOUNT_JSON (see lib/firestore-admin.js). Until
// billing env is configured this route answers 501 — safe to deploy dormant.
//
// NOTE: plan resolution in lib/plan-server.js caches per warm instance for
// 5 minutes, so AI routes may see the old plan briefly after activation.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  adminConfigured,
  adminFindOne,
  adminSetFields,
  adminLogEvent,
} from '@/lib/firestore-admin';

export const runtime = 'nodejs';

const LS_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function timingSafeEqualHex(aHex, bHex) {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- provider parsing → a normalized { action, plan, email } ----------------
// action: 'grant' | 'revoke' | null (ignore the event)

function parseLemonSqueezy(request, rawBody) {
  const sig = request.headers.get('x-signature') || '';
  const digest = crypto.createHmac('sha256', LS_SECRET).update(rawBody).digest('hex');
  if (!sig || !timingSafeEqualHex(digest, sig)) return { error: 'bad signature' };

  const payload = JSON.parse(rawBody);
  const event = payload?.meta?.event_name || '';
  const attrs = payload?.data?.attributes || {};
  const email = (attrs.user_email || attrs.customer_email || '').toLowerCase();
  // Plan comes from checkout custom data (?checkout[custom][plan]=…) with the
  // product/variant name as fallback so a manually-created checkout still maps.
  const custom = payload?.meta?.custom_data || {};
  const nameBlob = `${attrs.product_name || ''} ${attrs.variant_name || ''}`.toLowerCase();
  const plan = custom.plan || (nameBlob.includes('business') ? 'business' : 'pro');

  const GRANT = ['order_created', 'subscription_created', 'subscription_resumed', 'subscription_unpaused'];
  const REVOKE = ['subscription_expired'];
  const action = GRANT.includes(event) ? 'grant' : REVOKE.includes(event) ? 'revoke' : null;
  return { action, plan, email, event };
}

function parseStripe(request, rawBody) {
  const header = request.headers.get('stripe-signature') || '';
  const parts = Object.fromEntries(
    header.split(',').map((kv) => kv.split('=').map((s) => s.trim()))
  );
  if (!parts.t || !parts.v1) return { error: 'bad signature header' };
  const digest = crypto
    .createHmac('sha256', STRIPE_SECRET)
    .update(`${parts.t}.${rawBody}`)
    .digest('hex');
  if (!timingSafeEqualHex(digest, parts.v1)) return { error: 'bad signature' };

  const payload = JSON.parse(rawBody);
  const type = payload?.type || '';
  if (type !== 'checkout.session.completed') return { action: null, event: type };
  const session = payload?.data?.object || {};
  const email = (session.customer_details?.email || session.customer_email || '').toLowerCase();
  const plan = session.metadata?.plan === 'business' ? 'business' : 'pro';
  return { action: 'grant', plan, email, event: type };
}

// ---- apply ------------------------------------------------------------------

async function applyPlanChange({ action, plan, email, event }) {
  const user = await adminFindOne('users', 'email', email);
  if (!user) {
    // Paid with an email that has never signed in — park it for the founder.
    await adminLogEvent('billing_events', {
      status: 'unmatched',
      action,
      plan,
      email,
      event,
      note: 'No user with this email — activate manually in /admin/orgs.',
    });
    return { ok: true, matched: false };
  }

  if (plan === 'business') {
    // Business belongs to the buyer's workspace. If they don't own one yet the
    // event is parked; they create the workspace and the founder flips it.
    const org = await adminFindOne('orgs', 'ownerUid', user.id);
    if (!org) {
      await adminLogEvent('billing_events', {
        status: 'unmatched',
        action,
        plan,
        email,
        event,
        uid: user.id,
        note: 'Buyer owns no workspace — ask them to create one, then set plan in /admin/orgs.',
      });
      return { ok: true, matched: false };
    }
    await adminSetFields(`orgs/${org.id}`, {
      plan: action === 'grant' ? 'business' : 'free',
      ...(action === 'grant' && !org.seats ? { seats: 50 } : {}),
    });
    await adminLogEvent('billing_events', {
      status: 'applied',
      action,
      plan,
      email,
      event,
      orgId: org.id,
    });
    return { ok: true, matched: true, orgId: org.id };
  }

  await adminSetFields(`users/${user.id}`, { plan: action === 'grant' ? 'pro' : 'free' });
  await adminLogEvent('billing_events', {
    status: 'applied',
    action,
    plan: 'pro',
    email,
    event,
    uid: user.id,
  });
  return { ok: true, matched: true, uid: user.id };
}

export async function POST(request) {
  const isLS = Boolean(LS_SECRET) && request.headers.has('x-signature');
  const isStripe = Boolean(STRIPE_SECRET) && request.headers.has('stripe-signature');

  if (!isLS && !isStripe) {
    return NextResponse.json(
      {
        error: 'Billing webhook is not configured.',
        needed: ['LEMONSQUEEZY_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET', 'matching signature header'],
      },
      { status: 501 }
    );
  }
  if (!adminConfigured()) {
    // Signed request but we can't write — tell the provider to retry later.
    console.error('[billing] FIREBASE_SERVICE_ACCOUNT_JSON missing — cannot apply plan');
    return NextResponse.json({ error: 'server not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  let parsed;
  try {
    parsed = isLS ? parseLemonSqueezy(request, rawBody) : parseStripe(request, rawBody);
  } catch (e) {
    return NextResponse.json({ error: 'unparseable payload' }, { status: 400 });
  }
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 401 });
  }
  if (!parsed.action) {
    return NextResponse.json({ ok: true, ignored: parsed.event || 'event' });
  }
  if (!parsed.email) {
    await adminLogEvent('billing_events', { status: 'no-email', ...parsed });
    return NextResponse.json({ ok: true, matched: false });
  }

  try {
    const result = await applyPlanChange(parsed);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[billing]', e?.message);
    // 5xx → the provider retries; nothing is lost.
    return NextResponse.json({ error: 'apply failed' }, { status: 500 });
  }
}
