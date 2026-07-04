'use client';

// Portfolio persistence with optional cloud sync.
// - localStorage is always the fast local cache (works offline / signed out).
// - When the user is signed in (Supabase configured), the portfolio also syncs
//   to a `portfolios` row keyed by user id, so it follows them across devices.
// The UI only ever talks to usePortfolio() — it doesn't know or care which.

import { useEffect, useRef, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useUser } from '@/lib/auth';

const KEY = 'folio:portfolio';

export const EMPTY_PORTFOLIO = {
  onboarded: false,
  fullName: '',
  gradeLevel: '12',
  country: '',
  targetCountries: [],
  intendedMajor: '',
  academics: { gpa: '', gpaScale: '4', classRank: '', rigor: '' },
  testing: { sat: '', act: '', ielts: '', toefl: '', apScores: [] },
  activities: [],
  honors: [],
  narrative: { personalStatement: '', spike: '' },
  savedFeedback: null,
};

// --- One-off content hygiene -------------------------------------------------
// A user can paste junk (e.g. a joke URL) that then lives in their saved profile,
// and the AI review keeps flagging it. This strips such junk tokens from every
// text field on load, and drops a saved review that still mentions them so it
// regenerates clean. Idempotent: a no-op once the profile is clean. Safe to
// remove once existing profiles have been cleaned.
const JUNK_TEST = /freeporn/i; // non-global: safe for .test()
const JUNK_STRIP = /freeporn\S*/gi;

function scrubString(s) {
  if (typeof s !== 'string' || !JUNK_TEST.test(s)) return s;
  return s.replace(JUNK_STRIP, '').replace(/\s{2,}/g, ' ').trim();
}

export function sanitizePortfolio(p) {
  if (!p || typeof p !== 'object') return { portfolio: p, changed: false };
  const clean = JSON.parse(JSON.stringify(p));
  let changed = false;

  // Scrub every input string field (skip the saved review — handled below).
  const saved = clean.savedFeedback;
  delete clean.savedFeedback;
  (function walk(o) {
    for (const k in o) {
      const v = o[k];
      if (typeof v === 'string') {
        const nv = scrubString(v);
        if (nv !== v) {
          o[k] = nv;
          changed = true;
        }
      } else if (v && typeof v === 'object') {
        walk(v);
      }
    }
  })(clean);

  // A saved review that referenced the junk is dropped so it regenerates clean.
  clean.savedFeedback = saved && JUNK_TEST.test(JSON.stringify(saved)) ? null : saved;
  if (clean.savedFeedback !== saved) changed = true;

  // Remove activity/honor rows left completely empty by scrubbing.
  if (Array.isArray(clean.activities)) {
    const next = clean.activities.filter((a) =>
      `${a.position || ''}${a.organization || ''}${a.description || ''}`.trim()
    );
    if (next.length !== clean.activities.length) {
      clean.activities = next;
      changed = true;
    }
  }
  if (Array.isArray(clean.honors)) {
    const next = clean.honors.filter((h) => `${h.title || ''}`.trim());
    if (next.length !== clean.honors.length) {
      clean.honors = next;
      changed = true;
    }
  }

  return { portfolio: clean, changed };
}

export function loadPortfolio() {
  if (typeof window === 'undefined') return EMPTY_PORTFOLIO;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_PORTFOLIO;
    return { ...EMPTY_PORTFOLIO, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PORTFOLIO;
  }
}

export function savePortfolio(p) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* quota / private mode — ignore */
  }
}

// Heuristic: does this portfolio contain real user data worth uploading?
function hasContent(p) {
  return Boolean(
    p &&
      (p.fullName ||
        p.intendedMajor ||
        p.academics?.gpa ||
        (p.activities || []).length ||
        (p.honors || []).length)
  );
}

export function usePortfolio() {
  const { user, ready: authReady } = useUser();
  const [portfolio, setPortfolio] = useState(EMPTY_PORTFOLIO);
  const [ready, setReady] = useState(false);
  const syncedUser = useRef(null);
  // Guards against the empty local cache of a fresh device clobbering the cloud
  // before we've had a chance to pull it down.
  const cloudReady = useRef(false);

  // 1) Instant local load (with one-off junk cleanup).
  useEffect(() => {
    const { portfolio: clean, changed } = sanitizePortfolio(loadPortfolio());
    setPortfolio(clean);
    if (changed) savePortfolio(clean);
    setReady(true);
  }, []);

  // 2) On sign-in, reconcile local cache with the Firestore doc (once per user).
  useEffect(() => {
    if (!ready || !authReady) return;
    const db = getDb();
    if (!db || !user) {
      // Signed out / not configured — allow a fresh reconcile on next sign-in.
      syncedUser.current = null;
      cloudReady.current = false;
      return;
    }
    if (syncedUser.current === user.uid) return;
    syncedUser.current = user.uid;
    cloudReady.current = false;

    (async () => {
      try {
        const ref = doc(db, 'portfolios', user.uid);
        const snap = await getDoc(ref);
        const cloud = snap.exists() ? snap.data()?.data : null;

        if (cloud && hasContent(cloud)) {
          // Cloud wins — this is the source of truth across devices. Sanitize it
          // too; the persist effect then syncs the cleaned copy back to cloud.
          const { portfolio: merged } = sanitizePortfolio({ ...EMPTY_PORTFOLIO, ...cloud });
          setPortfolio(merged);
          savePortfolio(merged);
        } else if (hasContent(loadPortfolio())) {
          // Cloud empty but this device has real data → seed the cloud with it.
          await setDoc(ref, { data: loadPortfolio(), updatedAt: Date.now() });
        }
        // If both are empty, write nothing — the first real edit will sync.
      } catch {
        /* offline / rules — stay in local mode */
      } finally {
        cloudReady.current = true;
      }
    })();
  }, [ready, authReady, user]);

  // 3) Persist on change: localStorage always, cloud debounced when signed in.
  useEffect(() => {
    if (!ready) return;
    savePortfolio(portfolio);
    const db = getDb();
    if (!db || !user) return;
    // Don't push to the cloud until we've pulled it once — otherwise a fresh
    // device's empty cache would overwrite the user's real data.
    if (!cloudReady.current) return;
    const t = setTimeout(() => {
      setDoc(doc(db, 'portfolios', user.uid), {
        data: portfolio,
        updatedAt: Date.now(),
      }).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [portfolio, ready, user]);

  const update = useCallback((patch) => {
    setPortfolio((prev) =>
      typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
    );
  }, []);

  return [portfolio, update, ready];
}

let _id = 0;
export function newId() {
  _id += 1;
  return `${Date.now().toString(36)}-${_id}`;
}
