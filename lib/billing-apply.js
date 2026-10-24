// Server-only: turn a Stripe or Dodo Payments subscription state into Folio
// plans in Firestore.
// Shared by the webhook (/api/webhooks/billing) and the post-checkout confirm
// route (/api/billing/confirm) — both are idempotent, so whichever arrives
// first activates the plan and the other is a no-op.
//
// Writes go through the service account (lib/firestore-admin.js), which is the
// only thing allowed to touch plan / billing fields (see firestore.rules).

import crypto from 'node:crypto';
import { adminFindOne, adminGetDoc, adminSetFields, adminLogEvent } from '@/lib/firestore-admin';
import { PLANS } from '@/lib/plans';

export const ORG_PLANS = ['business', 'businessPlus'];

export async function resolveUid({ uid, email }) {
  if (uid) {
    const doc = await adminGetDoc(`users/${uid}`);
    if (doc) return { uid, email: doc.email || email || '', doc };
  }
  if (email) {
    const user = await adminFindOne('users', 'email', email.toLowerCase());
    if (user) return { uid: user.id, email: user.email || email, doc: user };
  }
  return null;
}

// Mirrors lib/org.js createOrg, via the service account (no client session).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function randomCode(prefix, len = 8) {
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
    plan: 'free', // flipped by the caller right after
    seats: 0,
    createdAt: Date.now(),
  });
  // Admin-only — never on the org doc, which every member can read.
  await adminSetFields(`orgs/${orgId}/private/codes`, { counselorCode });
  await adminSetFields(`orgs/${orgId}/members/${uid}`, {
    role: 'orgAdmin',
    displayName: '',
    email: email || '',
    joinCode: '',
    joinedAt: Date.now(),
  });
  await adminSetFields(`joinCodes/${joinCode}`, { orgId, orgName, role: 'student', createdBy: uid, createdAt: Date.now() });
  await adminSetFields(`joinCodes/${counselorCode}`, { orgId, orgName, role: 'counselor', createdBy: uid, createdAt: Date.now() });
  await adminSetFields(`users/${uid}`, { role: 'orgAdmin', orgId });
  return { id: orgId, name: orgName };
}

// Normalised change:
//   action: 'grant' | 'revoke'
//   plan:   'pro' | 'business' | 'businessPlus'
//   status, currentPeriodEnd (ms), cancelAtPeriodEnd — subscription details
//   provider: 'stripe' | 'dodo' — picks the id fields (stripe* / dodo*)
export async function applyChange({
  provider = 'stripe',
  action,
  plan,
  uid,
  email,
  customerId,
  subscriptionId,
  status = null,
  currentPeriodEnd = null,
  cancelAtPeriodEnd = false,
  event,
}) {
  const who = await resolveUid({ uid, email });
  if (!who) {
    await adminLogEvent('billing_events', {
      status: 'unmatched', provider, action, plan, email: email || '', event,
      customerId: customerId || '', subscriptionId: subscriptionId || '',
      note: 'No matching user — activate manually in /admin/orgs.',
    });
    return { ok: true, matched: false };
  }

  const customerField = provider === 'dodo' ? 'dodoCustomerId' : 'stripeCustomerId';
  const subField = provider === 'dodo' ? 'dodoSubscriptionId' : 'stripeSubscriptionId';
  const stamp = {
    ...(customerId ? { [customerField]: customerId } : {}),
    ...(subscriptionId && action === 'grant' ? { [subField]: subscriptionId } : {}),
    subscriptionStatus: action === 'grant' ? status || 'active' : 'canceled',
    currentPeriodEnd: action === 'grant' ? currentPeriodEnd : null,
    cancelAtPeriodEnd: action === 'grant' ? Boolean(cancelAtPeriodEnd) : false,
    planUpdatedAt: Date.now(),
  };

  if (ORG_PLANS.includes(plan)) {
    let org = await adminFindOne('orgs', 'ownerUid', who.uid);
    if (!org && action === 'grant') org = await createWorkspaceFor(who.uid, { email: who.email });
    if (!org) return { ok: true, matched: false };
    // A late "deleted" event for an OLD subscription must not cancel a newer one.
    if (action === 'revoke' && org[subField] && subscriptionId && org[subField] !== subscriptionId) {
      await adminLogEvent('billing_events', { status: 'ignored_stale', action, plan, event, uid: who.uid, orgId: org.id });
      return { ok: true, matched: true, ignored: 'stale subscription' };
    }
    await adminSetFields(`orgs/${org.id}`, {
      plan: action === 'grant' ? plan : 'free',
      seats: action === 'grant' ? PLANS[plan].seats : 0,
      ...stamp,
    });
    if (customerId) await adminSetFields(`users/${who.uid}`, { [customerField]: customerId });
    await adminLogEvent('billing_events', { status: 'applied', provider, action, plan, email: who.email, event, uid: who.uid, orgId: org.id });
    return { ok: true, matched: true, orgId: org.id };
  }

  if (action === 'revoke' && who.doc?.[subField] && subscriptionId && who.doc[subField] !== subscriptionId) {
    await adminLogEvent('billing_events', { status: 'ignored_stale', action, plan: 'pro', event, uid: who.uid });
    return { ok: true, matched: true, ignored: 'stale subscription' };
  }
  await adminSetFields(`users/${who.uid}`, { plan: action === 'grant' ? 'pro' : 'free', ...stamp });
  await adminLogEvent('billing_events', { status: 'applied', provider, action, plan: 'pro', email: who.email, event, uid: who.uid });
  return { ok: true, matched: true, uid: who.uid };
}

// Stripe subscription object → { action, status, currentPeriodEnd, cancelAtPeriodEnd } | null
export function subscriptionState(sub) {
  if (!sub || typeof sub !== 'object') return null;
  const status = sub.status;
  // current_period_end moved onto items in newer API versions — read either.
  const endSec = sub.current_period_end || sub.items?.data?.[0]?.current_period_end || null;
  const base = {
    status,
    currentPeriodEnd: endSec ? endSec * 1000 : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  };
  if (['active', 'trialing', 'past_due'].includes(status)) return { action: 'grant', ...base };
  if (['canceled', 'unpaid', 'incomplete_expired'].includes(status)) return { action: 'revoke', ...base };
  return null; // incomplete / paused — wait for a definitive state
}
