// Stripe webhook — the single source of truth that turns payments into plans.
//
// Point a Stripe webhook endpoint at /api/webhooks/billing with events:
//   checkout.session.completed      → activate the purchased plan
//   customer.subscription.updated   → plan switches (portal), status changes
//   customer.subscription.deleted   → subscription ended → back to free
//   invoice.payment_failed          → logged for the founder (grace handled by
//                                     Stripe's own retry/cancel settings)
//
// Matching is exact: /api/billing/checkout stamps `uid` + `plan` into the
// session AND subscription metadata, so no email guessing is needed. Email
// lookup remains as a fallback for payments made outside the app (e.g. a
// Payment Link the founder sent by hand).
//
// A Business/Business Plus purchase activates the workspace the buyer owns —
// and if they don't own one yet, the workspace is CREATED right here (org doc,
// owner membership, both invite codes, user back-link), so the buyer lands in
// a ready Business Workspace seconds after paying.
//
// Requires FIREBASE_SERVICE_ACCOUNT_JSON + STRIPE_WEBHOOK_SECRET. Until both
// exist the route answers 501 — safe to deploy dormant.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  adminConfigured,
  adminFindOne,
  adminGetDoc,
  adminSetFields,
  adminLogEvent,
} from '@/lib/firestore-admin';
import { planForPrice } from '@/lib/stripe-server';
import { PLANS } from '@/lib/plans';

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const TOLERANCE_SEC = 5 * 60; // reject replayed events older than 5 minutes

function verifyStripeSignature(request, rawBody) {
  const header = request.headers.get('stripe-signature') || '';
  const parts = Object.fromEntries(
    header.split(',').map((kv) => kv.split('=').map((s) => s.trim()))
  );
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > TOLERANCE_SEC) return false;
  const digest = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${parts.t}.${rawBody}`)
    .digest('hex');
  const a = Buffer.from(digest, 'hex');
  const b = Buffer.from(parts.v1, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- helpers -----------------------------------------------------------------

const ORG_PLANS = ['business', 'businessPlus'];

async function resolveUid({ uid, email }) {
  if (uid) {
    const doc = await adminGetDoc(`users/${uid}`);
    if (doc) return { uid, email: doc.email || email || '' };
  }
  if (email) {
    const user = await adminFindOne('users', 'email', email.toLowerCase());
    if (user) return { uid: user.id, email: user.email || email };
  }
  return null;
}

// Server-side workspace creation — mirrors lib/org.js createOrg but through
// the service account (webhooks have no client session).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function randomCode(prefix, len = 4) {
  const bytes = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${prefix}-${s}`;
}

async function createWorkspaceFor(uid, { name, email }) {
  const orgId = crypto.randomBytes(10).toString('hex');
  const joinCode = randomCode('FOLIO');
  const counselorCode = randomCode('MENTOR');
  const orgName = name || 'My Workspace';
  await adminSetFields(`orgs/${orgId}`, {
    name: orgName,
    type: 'practice',
    ownerUid: uid,
    joinCode,
    counselorCode,
    plan: 'free', // flipped by the caller right after
    seats: 0,
    createdAt: Date.now(),
  });
  await adminSetFields(`orgs/${orgId}/members/${uid}`, {
    role: 'orgAdmin',
    displayName: '',
    email: email || '',
    joinCode: '',
    joinedAt: Date.now(),
  });
  await adminSetFields(`joinCodes/${joinCode}`, {
    orgId, orgName, role: 'student', createdBy: uid, createdAt: Date.now(),
  });
  await adminSetFields(`joinCodes/${counselorCode}`, {
    orgId, orgName, role: 'counselor', createdBy: uid, createdAt: Date.now(),
  });
  await adminSetFields(`users/${uid}`, { role: 'orgAdmin', orgId });
  return { id: orgId, name: orgName };
}

// Apply a normalized change. action: 'grant' | 'revoke'.
async function applyChange({ action, plan, uid, email, customerId, subscriptionId, event }) {
  const who = await resolveUid({ uid, email });
  if (!who) {
    await adminLogEvent('billing_events', {
      status: 'unmatched', action, plan, email: email || '', event,
      note: 'No matching user — activate manually in /admin/orgs.',
    });
    return { ok: true, matched: false };
  }

  const stamp = {
    ...(customerId ? { stripeCustomerId: customerId } : {}),
    ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    planUpdatedAt: Date.now(),
  };

  if (ORG_PLANS.includes(plan)) {
    let org = await adminFindOne('orgs', 'ownerUid', who.uid);
    if (!org && action === 'grant') {
      org = await createWorkspaceFor(who.uid, { email: who.email });
    }
    if (!org) return { ok: true, matched: false }; // revoke for a deleted org — nothing to do
    await adminSetFields(`orgs/${org.id}`, {
      plan: action === 'grant' ? plan : 'free',
      seats: action === 'grant' ? PLANS[plan].seats : 0,
      ...stamp,
    });
    // The workspace owner keeps Pro-level access through the org; also stamp
    // the customer id on the user doc so the portal route finds it either way.
    await adminSetFields(`users/${who.uid}`, stamp);
    await adminLogEvent('billing_events', {
      status: 'applied', action, plan, email: who.email, event, uid: who.uid, orgId: org.id,
    });
    return { ok: true, matched: true, orgId: org.id };
  }

  await adminSetFields(`users/${who.uid}`, {
    plan: action === 'grant' ? 'pro' : 'free',
    ...stamp,
  });
  await adminLogEvent('billing_events', {
    status: 'applied', action, plan: 'pro', email: who.email, event, uid: who.uid,
  });
  return { ok: true, matched: true, uid: who.uid };
}

// ---- event parsing -------------------------------------------------------------

function parseEvent(payload) {
  const type = payload?.type || '';
  const obj = payload?.data?.object || {};

  if (type === 'checkout.session.completed') {
    if (obj.mode && obj.mode !== 'subscription') return null;
    return {
      action: 'grant',
      plan: obj.metadata?.plan || 'pro',
      uid: obj.metadata?.uid || obj.client_reference_id || null,
      email: (obj.customer_details?.email || obj.customer_email || '').toLowerCase(),
      customerId: typeof obj.customer === 'string' ? obj.customer : null,
      subscriptionId: typeof obj.subscription === 'string' ? obj.subscription : null,
      event: type,
    };
  }

  if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    const priceId = obj.items?.data?.[0]?.price?.id || null;
    const plan = planForPrice(priceId) || obj.metadata?.plan || 'pro';
    const active = ['active', 'trialing', 'past_due'].includes(obj.status);
    const gone = type === 'customer.subscription.deleted' ||
      ['canceled', 'unpaid', 'incomplete_expired'].includes(obj.status);
    if (!active && !gone) return null; // incomplete etc. — wait for a real state
    return {
      action: gone ? 'revoke' : 'grant',
      plan,
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
        note: 'Stripe will retry per your dunning settings.',
      },
    };
  }

  return null;
}

// ---- route ----------------------------------------------------------------------

export async function POST(request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Billing webhook is not configured (STRIPE_WEBHOOK_SECRET).' },
      { status: 501 }
    );
  }
  if (!adminConfigured()) {
    console.error('[billing] FIREBASE_SERVICE_ACCOUNT_JSON missing — cannot apply plan');
    return NextResponse.json({ error: 'server not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyStripeSignature(request, rawBody)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'unparseable payload' }, { status: 400 });
  }

  const parsed = parseEvent(payload);
  if (!parsed) return NextResponse.json({ ok: true, ignored: payload?.type || 'event' });
  if (parsed.log) {
    await adminLogEvent('billing_events', parsed.log);
    return NextResponse.json({ ok: true, logged: true });
  }

  try {
    const result = await applyChange(parsed);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[billing]', e?.message);
    // 5xx → Stripe retries; nothing is lost.
    return NextResponse.json({ error: 'apply failed' }, { status: 500 });
  }
}
