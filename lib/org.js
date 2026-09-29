'use client';

// Organizations (schools / counseling practices) — the B2B layer.
//
// Data model:
//   orgs/{orgId}                  { name, type:'school'|'practice', ownerUid,
//                                   joinCode, counselorCode,
//                                   plan:'free'|'business'|'businessPlus',
//                                   seats, brandName?, createdAt }
//   orgs/{orgId}/members/{uid}    { role:'student'|'counselor'|'orgAdmin',
//                                   displayName, email, joinCode, joinedAt }
//   joinCodes/{CODE}              { orgId, orgName, role, createdBy, createdAt }
//   invites/{orgId}_{email}       { orgId, orgName, email, name, invitedBy,
//                                   invitedByName, createdAt } — a counselor
//                                   adds a student by email; the student sees
//                                   it on sign-in and accepts (consent stays
//                                   with the student)
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
  query,
  where,
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
// Self-created orgs always start on the FREE (inactive) plan with ZERO seats
// (rules enforce this too) — Business has no free tier, so the owner must
// subscribe before connecting any students. Paid plans are granted by the
// billing webhook or the founder console.
// `size`/`goals` are optional onboarding-survey answers — kept on the org doc
// so the founder sees intent when qualifying a pilot for a Business upsell.
export async function createOrg({ name, type, size, goals }, user) {
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
    seats: 0,
    createdAt: Date.now(),
    ...(size ? { size } : {}),
    ...(Array.isArray(goals) && goals.length ? { goals } : {}),
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
// `codeDoc` comes from lookupJoinCode() (code join) or an invite doc
// ({ orgId, orgName, role:'student', inviteId }). `currentOrgId` is the org the
// user is linked to now — switching workspaces drops the old membership so no
// ghost access is left behind.
export async function joinOrg(user, codeDoc, currentOrgId = null) {
  const db = getDb();
  if (!db || !user) throw new Error('Sign in first.');
  const { orgId, orgName, role, code, inviteId } = codeDoc;

  if (currentOrgId && currentOrgId !== orgId) {
    await deleteDoc(doc(db, 'orgs', currentOrgId, 'members', user.uid)).catch(() => {});
  }

  const batch = writeBatch(db);
  batch.set(doc(db, 'orgs', orgId, 'members', user.uid), {
    role,
    displayName: user.displayName || '',
    email: user.email || '',
    joinCode: code || '',
    ...(inviteId ? { inviteId } : {}),
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
  // The invite has done its job — clear it (best effort).
  if (inviteId) await deleteDoc(doc(db, 'invites', inviteId)).catch(() => {});
}

// ---- email invites (counselor adds students) ---------------------------------

export function inviteId(orgId, email) {
  return `${orgId}_${String(email).trim().toLowerCase()}`;
}

const EMAIL_RE = /^[^\s@<>(),;]+@[^\s@<>(),;]+\.[^\s@<>(),;]{2,}$/;

// Parse a pasted list: one per line / comma / semicolon; "Name <email>",
// "Name, email" and bare emails all work. Returns { valid:[{email,name}], invalid:[] }.
export function parseInviteList(text) {
  const valid = [];
  const invalid = [];
  const seen = new Set();
  const chunks = String(text || '')
    .split(/[\n;]+/)
    .flatMap((line) => (line.includes('<') ? [line] : line.split(/,(?=[^,]*@)|\t/)))
    .map((x) => x.trim())
    .filter(Boolean);
  for (const chunk of chunks) {
    const angle = chunk.match(/^(.*)<([^>]+)>\s*$/);
    let email = '';
    let name = '';
    if (angle) {
      name = angle[1].replace(/[",]/g, '').trim();
      email = angle[2].trim();
    } else {
      const m = chunk.match(/[^\s,;<>]+@[^\s,;<>]+/);
      email = m ? m[0] : chunk;
      name = m ? chunk.replace(m[0], '').replace(/[",]/g, '').trim() : '';
    }
    email = email.toLowerCase();
    if (!EMAIL_RE.test(email)) {
      invalid.push(chunk);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    valid.push({ email, name: name.slice(0, 80) });
  }
  return { valid, invalid };
}

export async function createInvites(org, entries, user) {
  const db = getDb();
  if (!db || !user) throw new Error('Sign in first.');
  const batch = writeBatch(db);
  for (const { email, name } of entries) {
    batch.set(doc(db, 'invites', inviteId(org.id, email)), {
      orgId: org.id,
      orgName: org.brandName || org.name || '',
      email,
      name: name || '',
      invitedBy: user.uid,
      invitedByName: user.displayName || user.email || '',
      createdAt: Date.now(),
    });
  }
  await batch.commit();
}

export async function revokeInvite(id) {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'invites', id));
}

// Staff: live list of the org's pending invites.
export function useOrgInvites(orgId) {
  const [invites, setInvites] = useState([]);
  useEffect(() => {
    const db = getDb();
    if (!db || !orgId) {
      setInvites([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, 'invites'), where('orgId', '==', orgId)),
      (snap) => setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setInvites([])
    );
    return () => unsub();
  }, [orgId]);
  return invites;
}

// Student: invites addressed to my (Google-verified) email.
export function useMyInvites(user) {
  const [invites, setInvites] = useState([]);
  const email = (user?.email || '').toLowerCase();
  useEffect(() => {
    const db = getDb();
    if (!db || !email) {
      setInvites([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, 'invites'), where('email', '==', email)),
      (snap) => setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setInvites([])
    );
    return () => unsub();
  }, [email]);
  return invites;
}

// Student (or counselor) leaves an org. Transparency requirement: students can
// always disconnect themselves; this removes the counselors' read access.
export async function leaveOrg(user, orgId) {
  const db = getDb();
  if (!db || !user) return;
  const batch = writeBatch(db);
  batch.delete(doc(db, 'orgs', orgId, 'members', user.uid));
  // Role falls back to student — a staff role without a membership behind it
  // is meaningless and just leaves ghost UI (dashboard link, staff nav).
  batch.set(doc(db, 'users', user.uid), { orgId: null, role: 'student' }, { merge: true });
  batch.set(
    doc(db, 'portfolios', user.uid),
    { orgId: null, orgName: null, counselorId: null },
    { merge: true }
  );
  await batch.commit();
}

// Org admin removes a member from the roster: unlink their portfolio (allowed
// by the staff-unlink rule) and delete the membership. Unlink runs first so a
// partial failure leaves the student visibly disconnected, not half-removed.
export async function removeMember(orgId, memberUid) {
  const db = getDb();
  try {
    await setDoc(
      doc(db, 'portfolios', memberUid),
      { orgId: null, orgName: null, counselorId: null },
      { merge: true }
    );
  } catch { /* staff member (no portfolio link) or already unlinked — fine */ }
  await deleteDoc(doc(db, 'orgs', orgId, 'members', memberUid));
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
