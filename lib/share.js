'use client';

// Shareable portfolio — implemented as CURATED SNAPSHOTS in shares/{shareId},
// never as public access to portfolios/{uid} (see firestore.rules). The
// student explicitly chooses what goes in; drafts/essays stay private unless
// opted in. The shareId is a long random string — knowing it is the
// capability; the collection can't be listed.

import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { profileBreakdown } from '@/lib/profile';
import { updatePortfolioMeta } from '@/lib/store';

export const DEFAULT_SHARE_OPTIONS = {
  testing: true, // scores visible
  narrative: false, // spike/essay stay private by default
  strength: true, // show the strength ring & pillars
};

export function newShareId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// The snapshot is a curated COPY, so later rule/model changes can't leak
// anything the student didn't opt into at share time.
export function buildSnapshot(portfolio, options, { badge, brand } = {}) {
  const p = portfolio || {};
  const opts = { ...DEFAULT_SHARE_OPTIONS, ...(options || {}) };
  const { strength, pillars } = profileBreakdown(p);
  return {
    fullName: p.fullName || '',
    gradeLevel: p.gradeLevel || '',
    country: p.country || '',
    targetCountries: p.targetCountries || [],
    intendedMajor: p.intendedMajor || '',
    academics: {
      gpa: p.academics?.gpa || '',
      gpaScale: p.academics?.gpaScale || '4',
      rigor: p.academics?.rigor || '',
    },
    testing: opts.testing
      ? {
          sat: p.testing?.sat || '',
          act: p.testing?.act || '',
          ielts: p.testing?.ielts || '',
          toefl: p.testing?.toefl || '',
          apScores: (p.testing?.apScores || []).filter((x) => x.subject),
        }
      : null,
    activities: (p.activities || []).map((a) => ({
      position: a.position || '',
      organization: a.organization || '',
      description: a.description || '',
      years: a.years || '',
      hours: a.hours || '',
    })),
    honors: (p.honors || []).map((h) => ({ title: h.title || '', level: h.level || 'school' })),
    narrative: opts.narrative
      ? { spike: p.narrative?.spike || '', personalStatement: p.narrative?.personalStatement || '' }
      : null,
    strength: opts.strength ? { value: strength, pillars } : null,
    badge: badge !== false, // "Made with Folio" — removed for Pro
    brand: brand || null, // white-label org name (Business)
  };
}

// Create/refresh the public snapshot and link it on the portfolio doc.
export async function publishShare(user, portfolio, options, shareId, extras) {
  const db = getDb();
  if (!db || !user) throw new Error('Sign in to create a share link.');
  const id = shareId || newShareId();
  await setDoc(doc(db, 'shares', id), {
    ownerUid: user.uid,
    snapshot: buildSnapshot(portfolio, options, extras),
    updatedAt: Date.now(),
  });
  await updatePortfolioMeta(user.uid, { shareId: id, shareOptions: options });
  return id;
}

export async function unpublishShare(user, shareId) {
  const db = getDb();
  if (!db || !user || !shareId) return;
  try {
    await deleteDoc(doc(db, 'shares', shareId));
  } catch {
    /* already gone */
  }
  await updatePortfolioMeta(user.uid, { shareId: null, shareOptions: null });
}
