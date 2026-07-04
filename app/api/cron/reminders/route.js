// Deadline reminder delivery — SOCKET, not yet live (see REPORT.md § K).
//
// Serverless can't "ring an alarm" by itself; delivery needs a scheduler +
// a channel. The recommended free path:
//   1. Vercel Cron (vercel.json: { "crons": [{ "path": "/api/cron/reminders",
//      "schedule": "0 9 * * *" }] }) — 1 daily job is free on Hobby.
//   2. Set CRON_SECRET (Vercel injects it as the Authorization header).
//   3. Email via Resend free tier (RESEND_API_KEY) — or a Telegram bot
//      (TELEGRAM_BOT_TOKEN), which lands better in the CIS market.
//   4. Reading all users' tracked deadlines server-side requires the Firebase
//      Admin SDK (service account) — client-token tricks don't work for a
//      cron with no user. That's the one manual setup step.
//
// Until those pieces exist this endpoint answers 501 so the cron can be wired
// first and the implementation dropped in without changing infra.
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const ready = Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON &&
      (process.env.RESEND_API_KEY || process.env.TELEGRAM_BOT_TOKEN)
  );
  if (!ready) {
    return NextResponse.json(
      {
        error: 'Reminder delivery is not configured yet.',
        needed: ['FIREBASE_SERVICE_ACCOUNT_JSON', 'RESEND_API_KEY or TELEGRAM_BOT_TOKEN'],
        docs: 'See REPORT.md § Deadlines & reminders.',
      },
      { status: 501 }
    );
  }

  // TODO(owner): with the Admin SDK — query portfolios where trackedDeadlines
  // is non-empty, compute daysUntil per entry (lib/deadlines.js), and send one
  // digest per user for deadlines within their reminder window (default 7d).
  return NextResponse.json({ ok: true, sent: 0, note: 'delivery not implemented yet' });
}
