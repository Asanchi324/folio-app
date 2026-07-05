// Server-side Firestore writes WITHOUT the firebase-admin package.
//
// Why: security rules forbid clients from ever writing `plan` fields (that's
// the whole paid gate), so plan activation from a payment webhook needs
// server credentials. Instead of pulling in the heavy Admin SDK we mint a
// Google OAuth2 access token from a service account key with node:crypto
// (RS256 JWT → token exchange) and call the Firestore REST API. Requests
// authenticated this way bypass security rules — exactly what the webhook
// needs, and nothing a browser can ever reach.
//
// Setup (one env var):
//   FIREBASE_SERVICE_ACCOUNT_JSON — the full JSON of a service account key
//   (Firebase console → Project settings → Service accounts → Generate key),
//   pasted as a single line. Optional until you enable online payments.

import crypto from 'node:crypto';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.error('[firestore-admin] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
    return null;
  }
}

export function adminConfigured() {
  return Boolean(PROJECT_ID && serviceAccount());
}

// ---- OAuth2 token from the service account (cached per warm instance) -------
let _token = null; // { value, exp }

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

async function accessToken() {
  if (_token && _token.exp - 60_000 > Date.now()) return _token.value;
  const sa = serviceAccount();
  if (!sa) throw new Error('service account not configured');

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claims}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsigned)
    .sign(sa.private_key, 'base64url');
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  const data = await res.json();
  _token = { value: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 };
  return _token.value;
}

// ---- Firestore REST helpers ---------------------------------------------------
const BASE = () =>
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number')
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  return { mapValue: { fields: encodeFields(v) } };
}

function encodeFields(obj) {
  const out = {};
  for (const k in obj) out[k] = encodeValue(obj[k]);
  return out;
}

function decodeValue(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) return decodeDoc(v.mapValue?.fields);
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(decodeValue);
  return null;
}

function decodeDoc(fields) {
  const out = {};
  for (const k in fields || {}) out[k] = decodeValue(fields[k]);
  return out;
}

// Read one document by path. Returns decoded fields or null when missing.
export async function adminGetDoc(path) {
  const token = await accessToken();
  const res = await fetch(`${BASE()}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`get ${path} failed: ${res.status}`);
  const doc = await res.json();
  return decodeDoc(doc.fields);
}

// Find one document by an exact field match. Returns { id, ...fields } | null.
export async function adminFindOne(collection, field, value) {
  const token = await accessToken();
  const res = await fetch(`${BASE()}:runQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: 'EQUAL',
            value: encodeValue(value),
          },
        },
        limit: 1,
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`runQuery ${collection}.${field} failed: ${res.status}`);
  const rows = await res.json();
  const docRow = rows.find((r) => r.document);
  if (!docRow) return null;
  const id = docRow.document.name.split('/').pop();
  return { id, ...decodeDoc(docRow.document.fields) };
}

// Merge-patch specific fields on a document (creates it if missing).
export async function adminSetFields(path, fields) {
  const token = await accessToken();
  const mask = Object.keys(fields)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&');
  const res = await fetch(`${BASE()}/${path}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(fields) }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`patch ${path} failed: ${res.status}`);
  return res.json();
}

// Append an audit-trail document (billing_events/*) — best effort, never throws.
export async function adminLogEvent(collection, data) {
  try {
    const token = await accessToken();
    await fetch(`${BASE()}/${collection}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: encodeFields({ ...data, at: Date.now() }) }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.warn('[firestore-admin] audit log failed:', e?.message);
  }
}
