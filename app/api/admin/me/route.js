// Founder-admin gate. The client can't read FOLIO_ADMIN_EMAILS (server env),
// so the admin UI asks this route "am I a founder?". Actual write power is
// enforced independently by firestore.rules (isFounder email list) — this
// endpoint only decides whether to render the console.
import { NextResponse } from 'next/server';
import { bearerToken, verifyIdToken, isFounderEmail } from '@/lib/plan-server';

export const runtime = 'nodejs';

export async function POST(request) {
  const token = bearerToken(request);
  const who = token ? await verifyIdToken(token) : null;
  return NextResponse.json({
    admin: Boolean(who && isFounderEmail(who.email)),
    email: who?.email || null,
  });
}
