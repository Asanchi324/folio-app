/** @type {import('next').NextConfig} */

// Security headers for every response.
//
// CSP notes — each allowance exists for a specific integration:
//   • script-src 'unsafe-inline': Next.js inline bootstrap scripts (no nonce
//     pipeline yet). 'unsafe-eval' only in development (React refresh).
//   • apis.google.com + *.firebaseapp.com (frame): Firebase Google sign-in popup.
//   • *.googleapis.com (connect): Firestore, Identity Toolkit, token refresh.
//   • googletagmanager / google-analytics: GA4, loaded only after consent.
//   • Stripe is a full-page redirect (checkout.stripe.com), so it needs no CSP entry.
const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://apis.google.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com" +
    (isDev ? ' ws: wss:' : ''),
  'frame-src https://*.firebaseapp.com https://accounts.google.com',
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  // Firebase's sign-in popup needs to talk back to this window.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // API responses are per-user and must never be cached by intermediaries.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;
