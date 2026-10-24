// Founder console → "Check payments now". Same reconciliation as the daily
// cron (lib/dodo-sync.js), on demand, with the report shown in /admin/orgs.
import { NextResponse } from 'next/server';
import { bearerToken, verifyIdToken, isFounderEmail } from '@/lib/plan-server';
import { adminConfigured } from '@/lib/firestore-admin';
import { dodoConfigured } from '@/lib/dodo-server';
import { syncDodoSubscriptions } from '@/lib/dodo-sync';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  const token = bearerToken(request);
  const who = token ? await verifyIdToken(token) : null;
  if (!who || !isFounderEmail(who.email)) {
    return NextResponse.json({ error: 'Founders only.' }, { status: 403 });
  }
  if (!dodoConfigured() || !adminConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured (DODO_PAYMENTS_API_KEY, product ids, FIREBASE_SERVICE_ACCOUNT_JSON).' },
      { status: 501 }
    );
  }
  try {
    return NextResponse.json({ ok: true, ...(await syncDodoSubscriptions()) });
  } catch (e) {
    console.error('[admin/billing-sync]', e?.message);
    return NextResponse.json({ error: `Sync failed: ${e?.message || 'unknown error'}` }, { status: 502 });
  }
}
