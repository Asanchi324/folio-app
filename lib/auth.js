'use client';

// Auth hook (Firebase). In localStorage-only mode (no Firebase env) it reports
// no user and ready:true, so the product works without a backend.
import { useEffect, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
} from 'firebase/auth';

// An email/password account whose address isn't confirmed yet. The app treats
// it as signed out (no sync, no workspace) until the link in the email is
// clicked — Google accounts are always verified.
export function needsVerification(u) {
  return Boolean(u && !u.emailVerified && u.providerData.some((p) => p.providerId === 'password'));
}

// `user` is only ever a VERIFIED account; an unconfirmed email/password
// session is exposed separately as `pending` (for the "check your inbox" UI).
export function useUser() {
  const [raw, setRaw] = useState(null);
  const [ready, setReady] = useState(false);
  const [, setVersion] = useState(0);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setReady(true);
      return;
    }
    // Complete a redirect-based sign-in if we just came back from Google.
    getRedirectResult(auth).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      setRaw(u || null);
      setReady(true);
    });
    // reload() mutates the same User in place and doesn't fire
    // onAuthStateChanged — re-render so emailVerified is re-read.
    const onVerified = () => setVersion((n) => n + 1);
    window.addEventListener('folio:auth-reloaded', onVerified);
    return () => {
      unsub();
      window.removeEventListener('folio:auth-reloaded', onVerified);
    };
  }, []);

  const pending = needsVerification(raw);
  return { user: pending ? null : raw, pending: pending ? raw : null, ready };
}

// ---- email + password ---------------------------------------------------------
// Firebase is set to one account per email: signing up with an address that
// already has an account (e.g. via Google) fails with auth/email-already-in-use,
// so nobody can open a second account on someone else's email. A Google user
// who wants a password uses "Forgot password?" — the reset link adds one.

function verifyUrl() {
  return { url: `${window.location.origin}/login`, handleCodeInApp: false };
}

export async function signUpWithEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Sign-in is not configured yet.');
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await sendEmailVerification(user, verifyUrl()).catch(() => {});
  return user;
}

export async function signInWithEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Sign-in is not configured yet.');
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return user;
}

export async function resendVerification() {
  const u = getFirebaseAuth()?.currentUser;
  if (u) await sendEmailVerification(u, verifyUrl());
}

export async function resetPassword(email) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Sign-in is not configured yet.');
  await sendPasswordResetEmail(auth, email.trim(), verifyUrl());
}

// Re-read the account after the user clicked the link in another tab. Returns
// true once verified; also forces a fresh ID token so Firestore rules see
// email_verified == true.
export async function refreshVerification() {
  const u = getFirebaseAuth()?.currentUser;
  if (!u) return false;
  await reload(u);
  if (u.emailVerified) await u.getIdToken(true);
  window.dispatchEvent(new Event('folio:auth-reloaded'));
  return u.emailVerified;
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Sign-in is not configured yet.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Popup is the reliable path everywhere, including mobile: the credential is
  // delivered straight back to this tab (postMessage) and the session is stored
  // first-party, so it survives Safari/Chrome third-party-storage blocking.
  // Redirect is only a fallback for the rare case where a popup is blocked.
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = e?.code || '';
    if (code === 'auth/popup-closed-by-user') return; // user cancelled
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
}

// Human-readable reason a Google sign-in failed, for showing under the button.
// Unknown codes keep the raw code visible so a report from a user is debuggable.
export function googleSignInError(e, t) {
  const code = e?.code || '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return t('Google sign-in is not enabled for this address yet. Sign in with email for now, or try again later.');
    case 'auth/popup-blocked':
    case 'auth/cancelled-popup-request':
      return t('The sign-in window was blocked. Allow pop-ups for this site and try again.');
    case 'auth/account-exists-with-different-credential':
      return t('This email is already registered with a password. Sign in with email instead.');
    case 'auth/network-request-failed':
      return t('No connection. Check your internet and try again.');
    case 'auth/too-many-requests':
      return t('Too many attempts. Wait a few minutes and try again.');
    case 'auth/web-storage-unsupported':
      return t('Your browser blocks storage for this site. Leave private mode or allow cookies and try again.');
    case 'auth/user-disabled':
      return t('This account is disabled. Write to us and we will sort it out.');
    default:
      return code
        ? t('Could not sign in with Google ({code}). Try again or sign in with email.', { code })
        : e?.message || t('Could not sign in with Google. Try again or sign in with email.');
  }
}

export async function signOut() {
  const auth = getFirebaseAuth();
  if (auth) await fbSignOut(auth);
}

// Fresh Firebase ID token for authenticated API calls (plan checks happen
// server-side). Returns null signed out / unconfigured — callers then hit the
// API anonymously and get free-tier limits.
export async function getIdToken() {
  const auth = getFirebaseAuth();
  const u = auth?.currentUser;
  if (!u) return null;
  try {
    return await u.getIdToken();
  } catch {
    return null;
  }
}

// Shared helper: POST JSON to an API route with the auth token attached when
// available. Returns the parsed body; throws Error(message) on non-2xx.
export async function apiPost(path, body) {
  const token = await getIdToken();
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
