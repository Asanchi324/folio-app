'use client';

// Cookie-free visit counting (Vercel Web Analytics). Unlike Google Analytics it
// sets no cookies and stores no personal identifiers, so it runs for every
// visitor — including those who never answer the cookie banner — and gives
// the real number of visitors. Private IDs in URLs are redacted the same way
// as for GA before anything is sent.

import { Analytics } from '@vercel/analytics/next';
import { redactPath } from '@/components/Analytics';

function scrub(event) {
  try {
    const u = new URL(event.url);
    u.pathname = redactPath(u.pathname);
    u.search = '';
    return { ...event, url: u.toString() };
  } catch {
    return event;
  }
}

export default function VisitCounter() {
  return <Analytics beforeSend={scrub} />;
}
