'use client';

// Firebase init. Returns null pieces when env isn't configured yet, so the app
// degrades gracefully to localStorage-only mode (no crashes before keys exist).
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

let _auth = null;
let _db = null;

function ensureApp() {
  if (!isFirebaseConfigured()) return null;
  return getApps().length ? getApp() : initializeApp(config);
}

export function getFirebaseAuth() {
  if (_auth) return _auth;
  const app = ensureApp();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

export function getDb() {
  if (_db) return _db;
  const app = ensureApp();
  if (!app) return null;
  _db = getFirestore(app);
  return _db;
}
