'use client';

// Portfolio persistence — Firestore-first when signed in, localStorage-only
// otherwise.
//
//   Signed out / Firebase not configured → localStorage is the store (as ever).
//   Signed in → the Firestore doc `portfolios/{uid}` is the source of truth:
//     - live onSnapshot subscription (edits follow the user across devices,
//       and counselor comments / org links appear without a refresh),
//     - localStorage acts as a warm cache + optimistic buffer,
//     - writes are debounced (~900ms) and use merge:true so top-level link
//       fields (orgId, counselorId, shareId…) written by other flows survive.
//   Migration: on first sign-in, if the cloud doc is empty but this device has
//   real data, the local profile seeds the cloud. The cloudReady guard keeps a
//   fresh device's empty cache from clobbering the cloud.
//
// The UI only ever talks to usePortfolio() — it doesn't know or care which.

import { useEffect, useRef, useState, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
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
  trackedDeadlines: [],
};

// Top-level fields on portfolios/{uid} that live OUTSIDE `data`. They link the
// portfolio to the B2B layer and sharing, and are written with merge:true by
// their own flows (join org, share toggle) — never clobbered by data saves.
export const EMPTY_META = {
  orgId: null,
  orgName: null,
  counselorId: null,
  shareId: null,
  shareOptions: null,
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
  const [meta, setMeta] = useState(EMPTY_META);
  const [ready, setReady] = useState(false);
  // True once the cloud copy has been consulted (or there is none to consult).
  // Gates decisions that must not fire against a not-yet-hydrated portfolio,
  // like the "no data → onboarding" redirect.
  const [synced, setSynced] = useState(false);
  // Guards against the empty local cache of a fresh device clobbering the cloud
  // before we've had a chance to pull it down.
  const cloudReady = useRef(false);
  // JSON of the last state we pushed — lets us ignore the echo of our own write
  // coming back through onSnapshot without stomping in-progress typing.
  const lastPushed = useRef(null);

  // 1) Instant local load (with one-off junk cleanup).
  useEffect(() => {
    const { portfolio: clean, changed } = sanitizePortfolio(loadPortfolio());
    setPortfolio(clean);
    if (changed) savePortfolio(clean);
    setReady(true);
  }, []);

  // 2) Signed in → subscribe to the Firestore doc; it is the source of truth.
  useEffect(() => {
    if (!ready || !authReady) return;
    const db = getDb();
    if (!db || !user) {
      cloudReady.current = false;
      setMeta(EMPTY_META);
      setSynced(true); // nothing to wait for — local IS the source of truth
      return;
    }
    cloudReady.current = false;
    setSynced(false);
    lastPushed.current = null;
    const ref = doc(db, 'portfolios', user.uid);
    let first = true;

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const raw = snap.exists() ? snap.data() : null;
        const cloud = raw?.data || null;
        setMeta({
          orgId: raw?.orgId || null,
          orgName: raw?.orgName || null,
          counselorId: raw?.counselorId || null,
          shareId: raw?.shareId || null,
          shareOptions: raw?.shareOptions || null,
        });

        if (first) {
          first = false;
          if (cloud && hasContent(cloud)) {
            // Cloud wins — sanitize it too; the persist effect syncs the
            // cleaned copy back up if anything changed.
            const { portfolio: merged } = sanitizePortfolio({ ...EMPTY_PORTFOLIO, ...cloud });
            setPortfolio(merged);
            savePortfolio(merged);
          } else if (hasContent(loadPortfolio())) {
            // Cloud empty but this device has real data → seed the cloud.
            const local = loadPortfolio();
            lastPushed.current = JSON.stringify(local);
            setDoc(ref, { data: local, updatedAt: Date.now() }, { merge: true }).catch(() => {});
          }
          cloudReady.current = true;
          setSynced(true);
          return;
        }

        // Later snapshots: skip echoes of our own pending/just-committed writes,
        // adopt genuine remote edits (another device, a migration, a fix-up).
        if (snap.metadata.hasPendingWrites) return;
        if (!cloud) return;
        const remoteJson = JSON.stringify(cloud);
        if (remoteJson === lastPushed.current) return;
        const merged = { ...EMPTY_PORTFOLIO, ...cloud };
        setPortfolio((prev) => (JSON.stringify(prev) === remoteJson ? prev : merged));
        savePortfolio(merged);
      },
      () => {
        // offline / rules error — stay in local mode but let writes queue later
        cloudReady.current = true;
        setSynced(true);
      }
    );
    return () => unsub();
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
    if (JSON.stringify(portfolio) === lastPushed.current) return;
    const t = setTimeout(() => {
      lastPushed.current = JSON.stringify(portfolio);
      setDoc(
        doc(db, 'portfolios', user.uid),
        { data: portfolio, updatedAt: Date.now() },
        { merge: true }
      ).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [portfolio, ready, user]);

  const update = useCallback((patch) => {
    setPortfolio((prev) =>
      typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
    );
  }, []);

  return [portfolio, update, ready, meta, synced];
}

// Write top-level link/meta fields on portfolios/{uid} (merge — never touches
// `data`). Used by the join-org and sharing flows.
export async function updatePortfolioMeta(uid, patch) {
  const db = getDb();
  if (!db || !uid) return;
  await setDoc(doc(db, 'portfolios', uid), patch, { merge: true });
}

let _id = 0;
export function newId() {
  _id += 1;
  return `${Date.now().toString(36)}-${_id}`;
}
