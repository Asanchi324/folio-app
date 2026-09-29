#!/usr/bin/env node
// One-time Stripe setup for Folio. Idempotent — safe to run again.
//
//   STRIPE_SECRET_KEY=sk_test_… SITE_URL=https://foli0.vercel.app npm run stripe:setup
//
// Creates (or reuses, by lookup_key / URL):
//   • 3 recurring monthly prices: Pro $9, Business $149, Business Plus $299
//   • the webhook endpoint {SITE_URL}/api/webhooks/billing with the 4 events
//   • a Customer Portal configuration (update card, invoices, cancel,
//     switch between Business ↔ Business Plus)
// Then prints the env vars to paste into Vercel.
//
// Run it once with a TEST key (sk_test_…) and once with the LIVE key.

const KEY = process.env.STRIPE_SECRET_KEY;
const SITE = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://foli0.vercel.app').replace(/\/$/, '');
if (!KEY || !/^sk_(test|live)_/.test(KEY)) {
  console.error('Set STRIPE_SECRET_KEY=sk_test_… (or sk_live_…) first.');
  process.exit(1);
}

function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((it, i) => (typeof it === 'object' ? form(it, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(it))));
    else if (typeof v === 'object') form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripe(method, path, params) {
  const url = `https://api.stripe.com/v1/${path}${method === 'GET' && params ? `?${form(params)}` : ''}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : form(params || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: ${data?.error?.message || res.status}`);
  return data;
}

const PLANS = [
  { env: 'STRIPE_PRICE_PRO', lookup: 'folio_pro_monthly', name: 'Folio Pro', amount: 900, desc: 'AI essay coach, AI counselor, clean PDF and share link.' },
  { env: 'STRIPE_PRICE_BUSINESS', lookup: 'folio_business_monthly', name: 'Folio Business', amount: 14900, desc: 'School workspace for up to 20 students (each gets Pro).' },
  { env: 'STRIPE_PRICE_BUSINESS_PLUS', lookup: 'folio_business_plus_monthly', name: 'Folio Business Plus', amount: 29900, desc: 'School workspace for up to 75 students (each gets Pro).' },
];

const EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
];

async function ensurePrice(p) {
  const found = await stripe('GET', 'prices', { 'lookup_keys[]': p.lookup, limit: 1 });
  if (found.data?.[0]) return found.data[0];
  const product = await stripe('POST', 'products', { name: p.name, description: p.desc });
  return stripe('POST', 'prices', {
    product: product.id,
    currency: 'usd',
    unit_amount: p.amount,
    recurring: { interval: 'month' },
    lookup_key: p.lookup,
    nickname: p.name,
  });
}

async function ensureWebhook() {
  const url = `${SITE}/api/webhooks/billing`;
  const list = await stripe('GET', 'webhook_endpoints', { limit: 100 });
  const existing = list.data.find((w) => w.url === url);
  if (existing) {
    await stripe('POST', `webhook_endpoints/${existing.id}`, { enabled_events: EVENTS });
    return { endpoint: existing, secret: null };
  }
  const created = await stripe('POST', 'webhook_endpoints', { url, enabled_events: EVENTS, description: 'Folio plans' });
  return { endpoint: created, secret: created.secret };
}

async function ensurePortal(prices) {
  const business = prices.STRIPE_PRICE_BUSINESS;
  const plus = prices.STRIPE_PRICE_BUSINESS_PLUS;
  const config = {
    business_profile: { headline: 'Folio — manage your subscription' },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        proration_behavior: 'create_prorations',
        products: [
          { product: business.product, prices: [business.id] },
          { product: plus.product, prices: [plus.id] },
        ],
      },
    },
    default_return_url: `${SITE}/settings`,
  };
  const list = await stripe('GET', 'billing_portal/configurations', { limit: 10, is_default: true });
  if (list.data?.[0]) return stripe('POST', `billing_portal/configurations/${list.data[0].id}`, config);
  return stripe('POST', 'billing_portal/configurations', config);
}

const prices = {};
for (const p of PLANS) {
  const price = await ensurePrice(p);
  prices[p.env] = price;
  console.log(`✓ ${p.name}: ${price.id}`);
}
const { endpoint, secret } = await ensureWebhook();
console.log(`✓ Webhook: ${endpoint.url}`);
await ensurePortal(prices);
console.log('✓ Customer portal configured');

console.log('\n── Add these to Vercel (Production) ──────────────────────────');
console.log(`STRIPE_SECRET_KEY=${KEY.slice(0, 8)}…  (the key you used)`);
for (const p of PLANS) console.log(`${p.env}=${prices[p.env].id}`);
console.log(
  secret
    ? `STRIPE_WEBHOOK_SECRET=${secret}`
    : 'STRIPE_WEBHOOK_SECRET=(endpoint already existed — copy its signing secret from Dashboard → Developers → Webhooks)'
);
console.log(`NEXT_PUBLIC_SITE_URL=${SITE}`);
console.log('FIREBASE_SERVICE_ACCOUNT_JSON=(Firebase console → Project settings → Service accounts → Generate key, one line)');
