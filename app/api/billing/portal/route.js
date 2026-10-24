// Billing portal (Dodo customer portal or Stripe Billing Portal) — self-serve subscription management: switch plans,
// update the card, download invoices, cancel. The portal session is created
// for the Stripe customer stored on the user's own doc (server-read via the
// service account — the client can never point this at someone else's
// customer id).

import { NextResponse } from 'next/server';
import { resolveAccess } from '@/lib/plan-server';
import { stripeConfigured, stripePost, siteOrigin } from '@/lib/stripe-server';
import { dodoConfigured, dodo } from '@/lib/dodo-server';
import { adminConfigured, adminGetDoc, adminFindOne } from '@/lib/firestore-admin';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!(dodoConfigured() || stripeConfigured()) || !adminConfigured()) {
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
    // Dodo ids win when Dodo is live; Stripe ids keep old subscribers working.
    const userDoc = await adminGetDoc(`users/${access.uid}`);
    const org = userDoc?.dodoCustomerId || userDoc?.stripeCustomerId ? null : await adminFindOne('orgs', 'ownerUid', access.uid);
    const dodoCustomerId = dodoConfigured() ? userDoc?.dodoCustomerId || org?.dodoCustomerId || null : null;
    const customerId = stripeConfigured() ? userDoc?.stripeCustomerId || org?.stripeCustomerId || null : null;
    if (!dodoCustomerId && !customerId) {
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
    if (dodoCustomerId) {
      const session = await dodo().customers.customerPortal.create(dodoCustomerId, {
        return_url: `${siteOrigin(request)}${returnPath}`,
      });
      return NextResponse.json({ url: session.link });
    }
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
