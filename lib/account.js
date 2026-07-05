'use client';

// Platform account layer on top of Firebase auth.
//
// users/{uid} holds who the user IS on the platform (role, org link, plan):
//   { role: 'student'|'counselor'|'orgAdmin', orgId, displayName, email,
//     plan: 'free'|'pro', createdAt }
//
// The doc is created lazily with role:'student' on first sign-in. `plan` and
// `role` upgrades are protected by Firestore rules — the client can never set
// plan to anything but 'free' on itself (see firestore.rules); plans are set by
// the founder console or org membership.

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useUser } from '@/lib/auth';
import { useOrg, createOrg } from '@/lib/org';
import { effectiveStudentPlan, isFounder, PLANS } from '@/lib/plans';

const DEFAULT_PROFILE = { role: 'student', plan: 'free', orgId: null };

// Create users/{uid} on first sign-in. Never overwrites an existing profile
// (so an admin-granted plan or an org role is not reset by a fresh device).
export async function ensureUserDoc(user) {
  const db = getDb();
  if (!db || !user) return;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      // Keep display fields fresh without touching role/plan/orgId.
      const cur = snap.data() || {};
      if (cur.email !== user.email || cur.displayName !== (user.displayName || '')) {
        await setDoc(
          ref,
          { email: user.email || '', displayName: user.displayName || '' },
          { merge: true }
        );
      }
      return;
    }
    await setDoc(ref, {
      role: 'student',
      plan: 'free',
      orgId: null,
      displayName: user.displayName || '',
      email: user.email || '',
      createdAt: Date.now(),
    });
  } catch {
    /* offline / rules — the app still works without the profile doc */
  }
}

// Founder auto-grant — runs entirely in code, no manual Firestore edits.
// When the founder account signs in it receives Pro + the founder flag, and a
// Business workspace ("Folio HQ") is created if none exists. Every write here
// is authorized by the isFounder() email list in firestore.rules, so a
// non-founder triggering this path would simply be denied.
let _founderBootstrapRan = false;
async function ensureFounderGrant(user, profile) {
  if (_founderBootstrapRan || !user || !isFounder(user.email)) return;
  const db = getDb();
  if (!db) return;
  _founderBootstrapRan = true;
  try {
    if (profile.plan !== 'pro' || !profile.founder) {
      await setDoc(
        doc(db, 'users', user.uid),
        { plan: 'pro', founder: true },
        { merge: true }
      );
    }
    if (!profile.orgId) {
      const { orgId } = await createOrg({ name: 'Folio HQ', type: 'practice' }, user);
      await updateDoc(doc(db, 'orgs', orgId), {
        plan: 'business',
        seats: PLANS.business.seats,
      });
    }
  } catch (e) {
    // Rules said no (not actually a founder) or offline — never break the app.
    _founderBootstrapRan = false;
    console.warn('[founder-bootstrap]', e?.message);
  }
}

// Live view of the signed-in user's platform profile. Returns:
//   { user, ready, profile: { role, plan, orgId, ... } }
// Signed out / unconfigured → profile is the student/free default.
export function useAccount() {
  const { user, ready: authReady } = useUser();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    const db = getDb();
    if (!authReady) return;
    if (!db || !user) {
      setProfile(DEFAULT_PROFILE);
      setProfileReady(true);
      return;
    }
    setProfileReady(false);
    ensureUserDoc(user);
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const next = snap.exists() ? { ...DEFAULT_PROFILE, ...snap.data() } : DEFAULT_PROFILE;
        setProfile(next);
        setProfileReady(true);
        if (snap.exists()) ensureFounderGrant(user, next);
      },
      () => {
        setProfile(DEFAULT_PROFILE);
        setProfileReady(true);
      }
    );
    return () => unsub();
  }, [authReady, user]);

  return { user, ready: authReady && profileReady, profile };
}

// Effective plan for gating UI (locks/badges only — real enforcement is
// server-side): own plan, or Pro inherited from a Business org. Also exposes
// the org so callers can white-label (brand name on shares/PDFs).
export function useEffectivePlan() {
  const { user, ready, profile } = useAccount();
  const { org } = useOrg(profile?.orgId || null);
  const plan = effectiveStudentPlan({
    userPlan: profile?.plan || 'free',
    orgPlan: org?.plan || null,
  });
  return { user, ready, profile, org, plan, isPro: plan === 'pro' };
}
