// Stripe Billing Portal — self-serve subscription management: switch plans,
// update the card, download invoices, cancel. The portal session is created
// for the Stripe customer stored on the user's own doc (server-read via the
// service account — the client can never point this at someone else's
// customer id).

import { NextResponse } from 'next/server';
import { resolveAccess } from '@/lib/plan-server';
import { stripeConfigured, stripePost, siteOrigin } from '@/lib/stripe-server';
import { adminConfigured, adminGetDoc, adminFindOne } from '@/lib/firestore-admin';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!stripeConfigured() || !adminConfigured()) {
    return NextResponse.json(
      { error: 'The billing portal is not configured.', fallback: 'contact' },
      { status: 501 }
    );
  }
  const access = await resolveAccess(request);
  if (!access.uid) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  try {
    // Customer id lives on users/{uid} (Pro) and/or the org the user owns.
    let customerId = null;
    const userDoc = await adminGetDoc(`users/${access.uid}`);
    customerId = userDoc?.stripeCustomerId || null;
    if (!customerId) {
      const org = await adminFindOne('orgs', 'ownerUid', access.uid);
      customerId = org?.stripeCustomerId || null;
    }
    if (!customerId) {
      return NextResponse.json(
        { error: 'No subscription found on this account yet.' },
        { status: 404 }
      );
    }

    // Students return to Settings; workspace owners to workspace billing.
    let body = {};
    try {
      body = await request.json();
    } catch {}
    const returnPath = body?.returnTo === 'settings' ? '/settings' : '/business/billing';
    const session = await stripePost('billing_portal/sessions', {
      customer: customerId,
      return_url: `${siteOrigin(request)}${returnPath}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[billing/portal]', e?.message);
    return NextResponse.json({ error: 'Could not open the billing portal.' }, { status: 502 });
  }
}
