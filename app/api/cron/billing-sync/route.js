// Daily billing reconciliation (Vercel Cron, see vercel.json). Activates any
// paid Dodo subscription whose plan never reached Firestore and logs what it
// could not match — see lib/dodo-sync.js.
import { NextResponse } from 'next/server';
import { adminConfigured, adminLogEvent } from '@/lib/firestore-admin';
import { dodoConfigured } from '@/lib/dodo-server';
import { syncDodoSubscriptions } from '@/lib/dodo-sync';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request) {
  // Fail closed: without CRON_SECRET nobody may trigger the job.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!dodoConfigured() || !adminConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 501 });
  }
  try {
    const report = await syncDodoSubscriptions();
    if (report.fixed.length || report.unmatched.length || report.duplicates.length || report.errors.length) {
      console.warn('[billing-sync]', JSON.stringify(report));
      await adminLogEvent('billing_events', { status: 'sync_report', provider: 'dodo', event: 'cron.sync', report });
    }
    return NextResponse.json({ ok: true, ...report });
  } catch (e) {
    console.error('[billing-sync]', e?.message);
    return NextResponse.json({ error: 'sync failed' }, { status: 500 });
  }
}
