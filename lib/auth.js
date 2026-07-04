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
} from 'firebase/auth';

export function useUser() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setReady(true);
      return;
    }
    // Complete a redirect-based sign-in if we just came back from Google.
    getRedirectResult(auth).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return () => unsub();
  }, []);

  return { user, ready };
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
