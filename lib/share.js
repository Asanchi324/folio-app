'use client';

// Shareable portfolio — implemented as CURATED SNAPSHOTS in shares/{shareId},
// never as public access to portfolios/{uid} (see firestore.rules). The
// student explicitly chooses what goes in; drafts/essays stay private unless
// opted in. The shareId is a long random string — knowing it is the
// capability; the collection can't be listed by clients.
//
// "Students like you": a student may also opt in to being LISTED. Then the
// share doc carries top-level listedTargets / listedMajor, and the server
// route /api/peers (service account) matches signed-in students against
// them. Unlisted shares keep those fields empty, so they never match.

import { useEffect, useRef } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { profileBreakdown } from '@/lib/profile';
import { updatePortfolioMeta } from '@/lib/store';
import { cleanLinks, normMajor } from '@/lib/profile-card';
import { planHas, isOrgPaidPlan } from '@/lib/plans';

export const DEFAULT_SHARE_OPTIONS = {
  testing: true, // scores visible
  narrative: false, // spike/essay stay private by default
  strength: true, // show the strength ring & pillars
  targets: true, // target universities
  links: true, // LinkedIn / Telegram / site
  listed: false, // findable in "Students like you" — strictly opt-in
};

export function newShareId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Badge / white-label extras for a publish, from the effective plan.
export function shareExtras(plan, org) {
  return {
    badge: !planHas(plan, 'cleanShare'),
    brand: isOrgPaidPlan(org?.plan) ? org?.brandName || org?.name : null,
  };
}

// The snapshot is a curated COPY, so later rule/model changes can't leak
// anything the student didn't opt into at share time.
// `resolved` = resolveTargets(portfolio) (lib/targets.js), passed in so this
// module doesn't pull the ~380 KB university dataset into every page.
export function buildSnapshot(portfolio, options, { badge, brand } = {}, resolved = []) {
  const p = portfolio || {};
  const opts = { ...DEFAULT_SHARE_OPTIONS, ...(options || {}) };
  const { strength, pillars } = profileBreakdown(p);
  // Being listed means "find me by my targets", so a listed profile always
  // shows them.
  const showTargets = opts.targets !== false || opts.listed === true;
  const targets = showTargets ? resolved.map(({ id, name, country, location }) => ({ id, name, country, location })) : null;
  return {
    fullName: p.fullName || '',
    headline: String(p.headline || '').slice(0, 140),
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
    targets,
    topChoice: targets && targets.some((u) => u.id === p.topChoice) ? p.topChoice : null,
    links: opts.links !== false ? cleanLinks(p.links) : null,
    strength: opts.strength ? { value: strength, pillars } : null,
    badge: badge !== false, // "Made with Folio" — removed for Pro
    brand: brand || null, // white-label org name (Business)
  };
}

// Top-level, queryable listing fields (empty unless the student opted in).
function listingFields(p, opts) {
  const listed = opts?.listed === true;
  return {
    listed,
    listedTargets: listed ? (p.shortlist || []).slice(0, 30) : [],
    listedMajor: listed ? normMajor(p.intendedMajor) : '',
  };
}

// Create/refresh the public snapshot and link it on the portfolio doc.
export async function publishShare(user, portfolio, options, shareId, extras) {
  const db = getDb();
  if (!db || !user) throw new Error('Sign in to create a share link.');
  const id = shareId || newShareId();
  const opts = { ...DEFAULT_SHARE_OPTIONS, ...(options || {}) };
  const { resolveTargets } = await import('@/lib/targets');
  await setDoc(doc(db, 'shares', id), {
    ownerUid: user.uid,
    snapshot: buildSnapshot(portfolio, opts, extras, resolveTargets(portfolio || {})),
    ...listingFields(portfolio || {}, opts),
    updatedAt: Date.now(),
  });
  await updatePortfolioMeta(user.uid, { shareId: id, shareOptions: opts });
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

// While a share is live, keep its snapshot in step with the portfolio
// (debounced) so the public page and the "Students like you" listing never go
// stale. Mount it on any page where the portfolio can change.
// `enabled` should be the store's `synced` flag, so a stale local cache is
// never published over the real profile.
export function useLiveShare({ user, p, meta, extras, options, enabled = true }) {
  const timer = useRef(null);
  const shareId = meta?.shareId || null;
  const opts = options || meta?.shareOptions || null;
  const key = JSON.stringify([p, opts, extras]);
  useEffect(() => {
    if (!enabled || !shareId || !user) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      publishShare(user, p, opts, shareId, extras).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, shareId, user, enabled]);
}
