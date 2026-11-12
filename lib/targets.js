// Target universities = the student's shortlist (portfolio.shortlist, in the
// order they ranked it) + one optional "top choice". Resolved against the
// university dataset into display rows. Kept apart from profile-card.js so the
// public share page doesn't ship the whole dataset.

import { getUniversity } from '@/lib/universities';

export function resolveTargets(p = {}) {
  return (Array.isArray(p.shortlist) ? p.shortlist : [])
    .map((id) => getUniversity(id))
    .filter(Boolean)
    .map((u) => ({
      id: u.id,
      name: u.name,
      country: u.country || '',
      location: u.location || '',
      acceptRate: u.acceptRate ?? null,
    }));
}
