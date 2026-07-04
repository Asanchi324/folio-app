// Server-side identity + plan resolution for the API routes — WITHOUT the
// Firebase Admin SDK (no service account to manage, works on Vercel Hobby).
//
// How: the client attaches its Firebase ID token (Authorization: Bearer …).
//   1. We verify the token via the Identity Toolkit `accounts:lookup` REST
//      endpoint using the public NEXT_PUBLIC_FIREBASE_API_KEY — Google tells
//      us the uid/email iff the token is valid. Nothing secret needed.
//   2. We read users/{uid} and orgs/{orgId} through the Firestore REST API
//      *as that user* (same Bearer token) — security rules apply exactly as
//      they do on the client, so this can never read data the user couldn't.
//   3. The effective plan comes from lib/plans.js (own plan, or Pro inherited
//      from a Business org).
//
// Clients can't fake a plan: `plan` fields are only writable by the founder
// admin (enforced in firestore.rules), and this module is the only thing the
// AI routes trust. Everything fails CLOSED to 'free' — an invalid token just
// means free-tier limits, never a crash.

import { effectiveStudentPlan } from '@/lib/plans';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const configured = () => Boolean(API_KEY && PROJECT_ID);

// ---- tiny caches (per warm serverless instance) -----------------------------
const CACHE_TTL = 5 * 60 * 1000;
const _tokenCache = new Map(); // tokenHash -> { uid, email, at }
const _planCache = new Map(); // uid -> { resolved, at }

function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function cacheGet(map, key) {
  const e = map.get(key);
  if (!e) return null;
  if (Date.now() - e.at > CACHE_TTL) {
    map.delete(key);
    return null;
  }
  return e;
}

// ---- Firestore REST value decoding ------------------------------------------
function decodeValue(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) return decodeFields(v.mapValue?.fields);
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(decodeValue);
  return null;
}

export function decodeFields(fields) {
  const out = {};
  for (const k in fields || {}) out[k] = decodeValue(fields[k]);
  return out;
}

// GET a Firestore document via REST as the token's user. Returns decoded
// fields, or null (missing / permission denied / network).
export async function firestoreGetAs(idToken, path) {
  if (!configured()) return null;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return null;
    const doc = await res.json();
    return decodeFields(doc.fields);
  } catch {
    return null;
  }
}

// ---- token verification ------------------------------------------------------
export function bearerToken(request) {
  const h = request.headers.get('authorization') || '';
  const m = h.match(/^Bearer (.+)$/i);
  return m ? m[1] : null;
}

export async function verifyIdToken(idToken) {
  if (!idToken || !configured()) return null;
  const key = hash(idToken);
  const hit = cacheGet(_tokenCache, key);
  if (hit) return { uid: hit.uid, email: hit.email };
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const u = data?.users?.[0];
    if (!u?.localId) return null;
    const out = { uid: u.localId, email: u.email || '' };
    _tokenCache.set(key, { ...out, at: Date.now() });
    return out;
  } catch {
    return null;
  }
}

// ---- plan resolution ----------------------------------------------------------
// Returns { uid, email, plan ('free'|'pro'), userPlan, orgId, orgPlan, role }.
// Anonymous / invalid token / any failure → free.
export async function resolveAccess(request) {
  const anon = {
    uid: null,
    email: '',
    plan: 'free',
    userPlan: 'free',
    orgId: null,
    orgPlan: null,
    role: 'student',
  };
  const token = bearerToken(request);
  if (!token) return anon;
  const who = await verifyIdToken(token);
  if (!who) return anon;

  const cached = cacheGet(_planCache, who.uid);
  if (cached) return cached.resolved;

  const userDoc = (await firestoreGetAs(token, `users/${who.uid}`)) || {};
  const orgId = userDoc.orgId || null;
  let orgPlan = null;
  if (orgId) {
    const orgDoc = await firestoreGetAs(token, `orgs/${orgId}`);
    orgPlan = orgDoc?.plan || null;
  }
  const resolved = {
    uid: who.uid,
    email: who.email,
    plan: effectiveStudentPlan({ userPlan: userDoc.plan || 'free', orgPlan }),
    userPlan: userDoc.plan || 'free',
    orgId,
    orgPlan,
    role: userDoc.role || 'student',
  };
  _planCache.set(who.uid, { resolved, at: Date.now() });
  return resolved;
}

// Founder-admin check for /api/admin/* and admin UIs. Comma-separated list of
// emails in FOLIO_ADMIN_EMAILS (server env — never NEXT_PUBLIC).
export function isFounderEmail(email) {
  const list = (process.env.FOLIO_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email) && list.includes(email.toLowerCase());
}
