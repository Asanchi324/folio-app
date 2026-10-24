// Post-checkout confirmation. Stripe redirects back with ?session_id=…, Dodo
// with ?subscription_id=…; the client posts it here and we activate the plan
// immediately by reading it straight from the provider — so the buyer never waits on webhook delivery.
// Safe and idempotent: the session must belong to the signed-in user, and the
// webhook applying the same change later is a no-op.

import { NextResponse } from 'next/server';
import { resolveAccess } from '@/lib/plan-server';
import { stripeConfigured, stripeGet } from '@/lib/stripe-server';
import { dodoConfigured, dodo, dodoSubscriptionState } from '@/lib/dodo-server';
import { adminConfigured } from '@/lib/firestore-admin';
import { applyChange, subscriptionState } from '@/lib/billing-apply';
import { enforce } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!(dodoConfigured() || stripeConfigured()) || !adminConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 501 });
  }
  const access = await resolveAccess(request);
  if (!access.uid) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const limited = await enforce(request, 'billing-confirm', { burst: { limit: 5, windowMs: 60_000 }, daily: { limit: 30 } }, { id: access.uid });
  if (limited) return NextResponse.json(limited.body, { status: limited.status });

  let body = {};
  try {
    body = await request.json();
  } catch {}

  if (body?.subscriptionId) return confirmDodo(String(body.subscriptionId), access);
  if (!stripeConfigured()) return NextResponse.json({ error: 'Invalid session.' }, { status: 400 });

  const sessionId = String(body?.sessionId || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 400 });
  }

  try {
    const session = await stripeGet(`checkout/sessions/${sessionId}?expand[]=subscription`);
    const owner = session.metadata?.uid || session.client_reference_id;
    if (owner !== access.uid) return NextResponse.json({ error: 'Not your session.' }, { status: 403 });
    if (session.status !== 'complete' || !['paid', 'no_payment_required'].includes(session.payment_status)) {
      return NextResponse.json({ ok: false, pending: true });
    }
    const sub = typeof session.subscription === 'object' ? session.subscription : null;
    const state = subscriptionState(sub);
    if (!state || state.action !== 'grant') return NextResponse.json({ ok: false, pending: true });
    const result = await applyChange({
      ...state,
      plan: session.metadata?.plan || 'pro',
      uid: access.uid,
      email: access.email,
      customerId: typeof session.customer === 'string' ? session.customer : null,
      subscriptionId: sub?.id || null,
      event: 'checkout.confirm',
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[billing/confirm]', e?.message);
    return NextResponse.json({ error: 'Could not confirm the payment yet.' }, { status: 502 });
  }
}

async function confirmDodo(subscriptionId, access) {
  if (!dodoConfigured()) return NextResponse.json({ error: 'Billing is not configured.' }, { status: 501 });
  if (!/^sub_[A-Za-z0-9_-]{6,200}$/.test(subscriptionId)) {
    return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 });
  }
  try {
    const sub = await dodo().subscriptions.retrieve(subscriptionId);
    // Ownership: the uid stamped at checkout, else the signed-in email.
    const owner = sub.metadata?.uid;
    const sameEmail = access.email && sub.customer?.email?.toLowerCase() === access.email.toLowerCase();
    if (owner ? owner !== access.uid : !sameEmail) {
      return NextResponse.json({ error: 'Not your subscription.' }, { status: 403 });
    }
    const state = dodoSubscriptionState(sub);
    if (!state || state.action !== 'grant') return NextResponse.json({ ok: false, pending: true });
    const result = await applyChange({
      ...state,
      provider: 'dodo',
      plan: sub.metadata?.plan || 'pro',
      uid: access.uid,
      email: access.email,
      customerId: sub.customer?.customer_id || null,
      subscriptionId: sub.subscription_id,
      event: 'checkout.confirm',
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[billing/confirm:dodo]', e?.status || '', e?.message);
    return NextResponse.json({ error: 'Could not confirm the payment yet.' }, { status: 502 });
  }
}
