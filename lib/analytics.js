'use client';

// Thin wrapper over GA4's gtag. Every funnel step in the app calls track(...)
// so we can see WHERE users drop off — landing → onboarding → portfolio →
// feedback → a real next move. Safe to call anywhere:
//   - server / no window            → no-op
//   - GA not configured (no GA_ID)  → no-op (window.gtag is undefined)
// So you can wire events now and they simply start reporting the moment
// NEXT_PUBLIC_GA_ID is set in .env.local. Nothing breaks without it.
//
// The funnel event names, in order:
//   onboarding_start → onboarding_complete → portfolio_view →
//   feedback_view → chances_view → discover_view → opportunity_click
export function track(event, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', event, params);
  } catch {
    // Analytics must never break the app.
  }
}
