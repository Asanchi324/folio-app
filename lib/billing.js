'use client';

// Client-side billing helpers — thin wrappers over the Stripe-backed API
// routes. The server does everything sensitive (creating Checkout / Portal
// sessions, verifying webhooks, flipping plans in Firestore); the client only
// ever receives a redirect URL.
//
//   startCheckout(plan)  → POST /api/billing/checkout → redirect to Stripe
//   openBillingPortal()  → POST /api/billing/portal   → redirect to Stripe
//
// Degradation: when Stripe env isn't configured the routes answer 501 and the
// UI falls back to the concierge flow (write to BILLING_CONTACT — Kaspi/card,
// founder activates the plan in /admin/orgs the same day).

import { apiPost } from '@/lib/auth';
import { track } from '@/lib/analytics';

export const BILLING_CONTACT = 'hello@folio.app';

// plan: 'pro' | 'business' | 'businessPlus'
export async function startCheckout(plan) {
  track('checkout_open', { plan });
  const { url } = await apiPost('/api/billing/checkout', { plan });
  if (!url) throw new Error('Checkout is not available right now.');
  window.location.assign(url);
}

export async function openBillingPortal() {
  track('billing_portal_open');
  const { url } = await apiPost('/api/billing/portal', {});
  if (!url) throw new Error('The billing portal is not available right now.');
  window.location.assign(url);
}

// mailto fallback for the concierge flow.
export function contactHref(plan) {
  const names = { pro: 'Pro', business: 'Business', businessPlus: 'Business Plus' };
  return `mailto:${BILLING_CONTACT}?subject=Folio%20${encodeURIComponent(names[plan] || 'upgrade')}`;
}
