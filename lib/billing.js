// Billing configuration — provider-agnostic hosted checkout.
//
// Folio doesn't build its own payment forms. You create a hosted checkout
// (Lemon Squeezy product, Paddle checkout, Stripe Payment Link — anything
// that gives you a URL) and put it in env:
//
//   NEXT_PUBLIC_CHECKOUT_PRO_URL       — student Pro subscription
//   NEXT_PUBLIC_CHECKOUT_BUSINESS_URL  — school/counselor Business plan
//
// The /upgrade page then sends the signed-in buyer to that URL with their
// email prefilled. The provider's webhook (app/api/webhooks/billing) matches
// the payment back to the account by email and flips the plan in Firestore.
// With no env set, /upgrade falls back to the manual "write to us" flow —
// nothing breaks, the founder just activates plans by hand in /admin/orgs.

export const CHECKOUT_URLS = {
  pro: process.env.NEXT_PUBLIC_CHECKOUT_PRO_URL || '',
  business: process.env.NEXT_PUBLIC_CHECKOUT_BUSINESS_URL || '',
};

export function billingEnabled(plan) {
  return Boolean(CHECKOUT_URLS[plan]);
}

// Build the checkout URL with the buyer's email prefilled so the webhook can
// match the payment to the account. Each provider has its own query param;
// unknown providers just get the bare URL (the buyer types their email).
export function checkoutUrl(plan, email) {
  const base = CHECKOUT_URLS[plan];
  if (!base) return '';
  if (!email) return base;
  let host = '';
  try {
    host = new URL(base).hostname;
  } catch {
    return base;
  }
  const sep = base.includes('?') ? '&' : '?';
  if (host.endsWith('lemonsqueezy.com')) {
    return `${base}${sep}checkout[email]=${encodeURIComponent(email)}&checkout[custom][plan]=${plan}`;
  }
  if (host.endsWith('stripe.com')) {
    return `${base}${sep}prefilled_email=${encodeURIComponent(email)}`;
  }
  if (host.endsWith('paddle.com') || host.endsWith('polar.sh')) {
    return `${base}${sep}customer_email=${encodeURIComponent(email)}`;
  }
  return base;
}

export const BILLING_CONTACT = 'hello@folio.app';
