// Dodo Payments helpers — server only. Dodo is the Merchant of Record: it
// hosts checkout, handles tax, and runs the customer portal. When
// DODO_PAYMENTS_API_KEY is set, the billing routes use Dodo instead of Stripe.
//
// Env:
//   DODO_PAYMENTS_API_KEY              dodo_test_… / dodo_live_… (secret)
//   DODO_PAYMENTS_WEBHOOK_KEY          whsec_… (webhook route)
//   DODO_PAYMENTS_ENVIRONMENT          'live_mode' | 'test_mode' (default test)
//   DODO_PRODUCT_PRO                   pdt_… subscription product, Pro $9/mo
//   DODO_PRODUCT_BUSINESS              pdt_… Business $149/mo
//   DODO_PRODUCT_BUSINESS_PLUS         pdt_… Business Plus $299/mo

import DodoPayments from 'dodopayments';

const API_KEY = process.env.DODO_PAYMENTS_API_KEY;
// Anything but an explicit 'live_mode' stays in test — a typo never charges cards.
const ENVIRONMENT = process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode';

export const DODO_PRODUCTS = {
  pro: process.env.DODO_PRODUCT_PRO || '',
  business: process.env.DODO_PRODUCT_BUSINESS || '',
  businessPlus: process.env.DODO_PRODUCT_BUSINESS_PLUS || '',
};

export function dodoConfigured(plan) {
  if (!API_KEY) return false;
  return plan ? Boolean(DODO_PRODUCTS[plan]) : true;
}

let _client = null;
export function dodo() {
  if (!API_KEY) throw new Error('Dodo Payments is not configured');
  if (!_client) {
    _client = new DodoPayments({
      bearerToken: API_KEY,
      environment: ENVIRONMENT,
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || null,
      timeout: 15000,
    });
  }
  return _client;
}

// Map a Dodo product id back to a Folio plan id (plan changes in the portal
// only carry the new product).
export function planForProduct(productId) {
  for (const [plan, id] of Object.entries(DODO_PRODUCTS)) {
    if (id && id === productId) return plan;
  }
  return null;
}

// Dodo subscription object → { action, status, currentPeriodEnd, cancelAtPeriodEnd } | null
// Statuses: pending | active | on_hold | paused | cancelled | failed | expired | past_due
export function dodoSubscriptionState(sub) {
  if (!sub || typeof sub !== 'object') return null;
  const status = sub.status;
  const end = sub.next_billing_date ? Date.parse(sub.next_billing_date) : NaN;
  const base = {
    // Folio's UI already speaks Stripe's spelling ('canceled').
    status: status === 'cancelled' ? 'canceled' : status,
    currentPeriodEnd: Number.isFinite(end) ? end : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_next_billing_date),
  };
  // past_due keeps access during Dodo's grace period.
  if (['active', 'past_due'].includes(status)) return { action: 'grant', ...base };
  // Cancelled at period end: the customer paid through next_billing_date.
  if (status === 'cancelled' && base.cancelAtPeriodEnd && base.currentPeriodEnd > Date.now()) {
    return { action: 'grant', ...base };
  }
  if (['on_hold', 'paused', 'cancelled', 'failed', 'expired'].includes(status)) return { action: 'revoke', ...base };
  return null; // pending — wait for a definitive state
}
