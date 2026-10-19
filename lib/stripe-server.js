// Stripe REST helpers — server only. No SDK dependency: the API is plain
// form-encoded HTTPS, and we only need four calls (create checkout session,
// create portal session, retrieve subscription, verify webhook signatures via
// node:crypto in the webhook route).
//
// Env:
//   STRIPE_SECRET_KEY            sk_live_… / sk_test_…
//   STRIPE_WEBHOOK_SECRET        whsec_… (webhook route)
//   STRIPE_PRICE_PRO             price id for Pro $9/mo
//   STRIPE_PRICE_BUSINESS        price id for Business $149/mo
//   STRIPE_PRICE_BUSINESS_PLUS   price id for Business Plus $299/mo
//
// All optional: without STRIPE_SECRET_KEY billing routes answer 501 and the
// UI degrades to the concierge (mailto) flow.

const SECRET = process.env.STRIPE_SECRET_KEY;

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRICE_PRO || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
  businessPlus: process.env.STRIPE_PRICE_BUSINESS_PLUS || '',
};

export function stripeConfigured(plan) {
  if (!SECRET) return false;
  return plan ? Boolean(STRIPE_PRICES[plan]) : true;
}

// Map a Stripe price id back to a Folio plan id (webhook: plan changes made in
// the customer portal only carry the new price).
export function planForPrice(priceId) {
  for (const [plan, id] of Object.entries(STRIPE_PRICES)) {
    if (id && id === priceId) return plan;
  }
  return null;
}

// Flatten { a: { b: 'x' }, c: ['y'] } → a[b]=x & c[0]=y (Stripe's form encoding).
function formEncode(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) =>
        typeof item === 'object' ? formEncode(item, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item))
      );
    } else if (typeof v === 'object') {
      formEncode(v, key, out);
    } else {
      out.append(key, String(v));
    }
  }
  return out;
}

export async function stripePost(path, params) {
  if (!SECRET) throw new Error('Stripe is not configured');
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formEncode(params),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Stripe ${path} failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function stripeGet(path) {
  if (!SECRET) throw new Error('Stripe is not configured');
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe ${path} failed (${res.status})`);
  return data;
}

// The site origin for success/cancel URLs. Prefer the request origin (works on
// previews); NEXT_PUBLIC_SITE_URL wins when set (canonical prod domain).
export function siteOrigin(request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  try {
    return new URL(request.url).origin;
  } catch {
    return 'https://www.folioapply.com';
  }
}
