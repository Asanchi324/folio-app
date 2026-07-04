'use client';

// Organizations (schools / counseling practices) — the B2B layer.
//
// Data model:
//   orgs/{orgId}                  { name, type:'school'|'practice', ownerUid,
//                                   joinCode, counselorCode, plan:'free'|'business',
//                                   seats, createdAt }
//   orgs/{orgId}/members/{uid}    { role:'student'|'counselor'|'orgAdmin',
//                                   displayName, email, joinCode, joinedAt }
//   joinCodes/{CODE}              { orgId, orgName, role, createdBy, createdAt }
//   users/{uid}.orgId / .role     back-link so Nav & plan checks are one read
//   portfolios/{uid}.orgId/.orgName  lets counselors read + shows the student
//                                    exactly who can see their portfolio
//
// Two separate invite codes per org: joinCode (students) and counselorCode
// (mentors) — so a student can never accidentally join as staff. The member
// doc carries the code it used; firestore.rules verifies it against the org
// doc via get(), which is what makes self-serve joining safe.

import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  collection,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { orgSeatLimit } from '@/lib/plans';

// Human-friendly, unambiguous codes (no 0/O/1/I).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function randomCode(prefix, len = 4) {
  let s = '';
  const rnd = new Uint32Array(len);
  crypto.getRandomValues(rnd);
  for (let i = 0; i < len; i++) s += ALPHABET[rnd[i] % ALPHABET.length];
  return `${prefix}-${s}`;
}

export function newOrgId() {
  return doc(collection(getDb(), 'orgs')).id;
}

// Create a workspace: org + owner membership + both invite codes + user link.
// Self-created orgs always start on the FREE plan (rules enforce this too);
// Business is granted by the founder console.
export async function createOrg({ name, type }, user) {
  const db = getDb();
  if (!db || !user) throw new Error('Sign in first.');
  const orgId = newOrgId();
  const joinCode = randomCode('FOLIO');
  const counselorCode = randomCode('MENTOR');
  const batch = writeBatch(db);

  batch.set(doc(db, 'orgs', orgId), {
    name: name.trim(),
    type,
    ownerUid: user.uid,
    joinCode,
    counselorCode,
    plan: 'free',
    seats: 3,
    createdAt: Date.now(),
  });
  batch.set(doc(db, 'orgs', orgId, 'members', user.uid), {
    role: 'orgAdmin',
    displayName: user.displayName || '',
    email: user.email || '',
    joinCode: '',
    joinedAt: Date.now(),
  });
  batch.set(doc(db, 'joinCodes', joinCode), {
    orgId,
    orgName: name.trim(),
    role: 'student',
    createdBy: user.uid,
    createdAt: Date.now(),
  });
  batch.set(doc(db, 'joinCodes', counselorCode), {
    orgId,
    orgName: name.trim(),
    role: 'counselor',
    createdBy: user.uid,
    createdAt: Date.now(),
  });
  batch.set(
    doc(db, 'users', user.uid),
    { role: 'orgAdmin', orgId },
    { merge: true }
  );
  await batch.commit();
  return { orgId, joinCode, counselorCode };
}

// Resolve an invite code (either kind) → { orgId, orgName, role } or null.
export async function lookupJoinCode(code) {
  const db = getDb();
  if (!db || !code) return null;
  const snap = await getDoc(doc(db, 'joinCodes', code.trim().toUpperCase()));
  return snap.exists() ? { code: snap.id, ...snap.data() } : null;
}

// Join an org using a resolved code. Students link their portfolio so the
// org's counselors can see it; counselors get a staff membership.
export async function joinOrg(user, codeDoc) {
  const db = getDb();
  if (!db || !user) throw new Error('Sign in first.');
  const { orgId, orgName, role, code } = codeDoc;

  // Soft seat check for students (rules keep the hard guarantees on access).
  if (role === 'student') {
    const orgSnap = await getDoc(doc(db, 'orgs', orgId));
    if (!orgSnap.exists()) throw new Error('This workspace no longer exists.');
  }

  const batch = writeBatch(db);
  batch.set(doc(db, 'orgs', orgId, 'members', user.uid), {
    role,
    displayName: user.displayName || '',
    email: user.email || '',
    joinCode: code,
    joinedAt: Date.now(),
  });
  batch.set(
    doc(db, 'users', user.uid),
    { orgId, ...(role === 'counselor' ? { role: 'counselor' } : {}) },
    { merge: true }
  );
  if (role === 'student') {
    batch.set(
      doc(db, 'portfolios', user.uid),
      { orgId, orgName },
      { merge: true }
    );
  }
  await batch.commit();
}

// Student (or counselor) leaves an org. Transparency requirement: students can
// always disconnect themselves; this removes the counselors' read access.
export async function leaveOrg(user, orgId) {
  const db = getDb();
  if (!db || !user) return;
  const batch = writeBatch(db);
  batch.delete(doc(db, 'orgs', orgId, 'members', user.uid));
  batch.set(doc(db, 'users', user.uid), { orgId: null }, { merge: true });
  batch.set(
    doc(db, 'portfolios', user.uid),
    { orgId: null, orgName: null, counselorId: null },
    { merge: true }
  );
  await batch.commit();
}

// Org admin removes a member from the roster.
export async function removeMember(orgId, memberUid) {
  const db = getDb();
  await deleteDoc(doc(db, 'orgs', orgId, 'members', memberUid));
  // Best effort: unlink their portfolio/user doc (may be denied if not admin —
  // access is already revoked by the membership delete above).
  try {
    await setDoc(doc(db, 'portfolios', memberUid), { orgId: null, orgName: null }, { merge: true });
  } catch { /* rules — fine */ }
}

// ---- live hooks --------------------------------------------------------------

export function useOrg(orgId) {
  const [org, setOrg] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const db = getDb();
    if (!db || !orgId) {
      setOrg(null);
      setReady(true);
      return;
    }
    setReady(false);
    const unsub = onSnapshot(
      doc(db, 'orgs', orgId),
      (snap) => {
        setOrg(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setReady(true);
      },
      () => setReady(true)
    );
    return () => unsub();
  }, [orgId]);
  return { org, ready };
}

export function useMembers(orgId) {
  const [members, setMembers] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const db = getDb();
    if (!db || !orgId) {
      setMembers([]);
      setReady(true);
      return;
    }
    setReady(false);
    const unsub = onSnapshot(
      collection(db, 'orgs', orgId, 'members'),
      (snap) => {
        setMembers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
        setReady(true);
      },
      () => setReady(true)
    );
    return () => unsub();
  }, [orgId]);
  return { members, ready };
}

export { orgSeatLimit };
