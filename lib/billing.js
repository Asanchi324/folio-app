'use client';

// Client-side billing helpers — thin wrappers over the Stripe-backed API
// routes. The server does everything sensitive (creating Checkout / Portal
// sessions, verifying webhooks, flipping plans in Firestore); the client only
// ever receives a redirect URL.
//
//   startCheckout(plan)  → POST /api/billing/checkout → redirect to Stripe
//   openBillingPortal()  → POST /api/billing/portal   → redirect to Stripe
//   (return from checkout) → confirmCheckoutReturn() → POST /api/billing/confirm
//                            (retried) → plan applied instantly
//
// Degradation: when Stripe env isn't configured the routes answer 501 and the
// UI falls back to the concierge flow (write to BILLING_CONTACT — Kaspi/card,
// founder activates the plan in /admin/orgs the same day).

import { apiPost } from '@/lib/auth';
import { track } from '@/lib/analytics';

export const BILLING_CONTACT = 'temirbekov.assan@outlook.com';

// plan: 'pro' | 'business' | 'businessPlus'
export async function startCheckout(plan) {
  track('checkout_open', { plan });
  const { url } = await apiPost('/api/billing/checkout', { plan });
  if (!url) throw new Error('Checkout is not available right now.');
  window.location.assign(url);
}

// returnTo: 'settings' (student Pro) | 'business' (workspace owner, default)
export async function openBillingPortal(returnTo = 'business') {
  track('billing_portal_open');
  const { url } = await apiPost('/api/billing/portal', { returnTo });
  if (!url) throw new Error('The billing portal is not available right now.');
  window.location.assign(url);
}

// Back from checkout: ask the server to confirm the payment, retrying for ~3
// minutes — a fresh subscription can sit in `pending` for a few seconds, and
// one dropped request must not leave a paying customer without their plan.
// Resolves 'active' | 'pending' (still not confirmed — webhook / daily sync
// will finish it) | 'none' (no checkout id in the URL).
const CONFIRM_DELAYS_MS = [0, 2000, 3000, 5000, 8000, 12000, 20000, 30000, 45000, 60000];

export async function confirmCheckoutReturn() {
  const q = new URLSearchParams(window.location.search);
  const subscriptionId = q.get('subscription_id'); // Dodo Payments
  const sessionId = q.get('session_id'); // Stripe
  if (!subscriptionId && !sessionId) return 'none';
  const body = subscriptionId ? { subscriptionId } : { sessionId };
  for (const delay of CONFIRM_DELAYS_MS) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    try {
      const res = await apiPost('/api/billing/confirm', body);
      if (res?.ok && res.matched !== false) {
        track('checkout_confirmed', { plan: q.get('plan') || '' });
        return 'active';
      }
    } catch (e) {
      // 4xx other than rate limiting won't get better by retrying.
      if (e?.status && e.status < 500 && e.status !== 429) break;
    }
  }
  track('checkout_confirm_pending', { plan: q.get('plan') || '' });
  return 'pending';
}

// The checkout reference to quote to support when activation is slow.
export function checkoutReference() {
  const q = new URLSearchParams(window.location.search);
  return q.get('subscription_id') || q.get('session_id') || '';
}

// mailto fallback for the concierge flow.
export function contactHref(plan) {
  const names = { pro: 'Pro', business: 'Business', businessPlus: 'Business Plus' };
  return `mailto:${BILLING_CONTACT}?subject=Folio%20${encodeURIComponent(names[plan] || 'upgrade')}`;
}
