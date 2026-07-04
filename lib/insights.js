// Counselor-facing signals derived from a student portfolio: attention flags
// and 1–2 suggested next steps. Pure functions — used by the roster, the
// student detail view and the CSV export, so a counselor sees the same story
// everywhere. Reuses the same heuristics that drive the student-side scores.

import { completeness, profileBreakdown } from '@/lib/profile';
import { selectCompetitions } from '@/lib/competitions';

const LEADERSHIP_RE = /found|president|captain|lead|director|ceo|editor|head|chair|organi/i;

// Ordered by how loudly a counselor should hear about it.
export function studentFlags(p = {}) {
  const flags = [];
  const acts = p.activities || [];
  const honors = p.honors || [];
  const t = p.testing || {};

  if (!p.academics?.gpa) flags.push({ key: 'gpa', label: 'No GPA', severity: 'bad' });
  if (!t.sat && !t.act) flags.push({ key: 'test', label: 'No SAT/ACT', severity: 'warn' });
  if (!t.ielts && !t.toefl) flags.push({ key: 'english', label: 'No IELTS/TOEFL', severity: 'warn' });
  if (!(p.narrative?.personalStatement || '').trim())
    flags.push({ key: 'essay', label: 'No essay draft', severity: 'bad' });
  if (acts.length === 0) {
    flags.push({ key: 'acts', label: 'No activities', severity: 'bad' });
  } else if (!acts.some((a) => LEADERSHIP_RE.test(a.position || ''))) {
    flags.push({ key: 'leadership', label: 'Membership, not leadership', severity: 'warn' });
  }
  if (honors.length === 0) flags.push({ key: 'honors', label: 'No honors', severity: 'warn' });
  if (!(p.intendedMajor || '').trim()) flags.push({ key: 'major', label: 'No intended major', severity: 'warn' });

  return flags;
}

// 1–2 concrete talking points for the next mentor meeting, generated from the
// weakest pillar + the catalog. Deterministic, no AI call needed.
export function nextSteps(p = {}) {
  const { pillars } = profileBreakdown(p);
  const flags = studentFlags(p);
  const steps = [];

  const worst = [...pillars].sort((a, b) => a.score - b.score)[0];
  const comps = selectCompetitions(p, 4);

  if (flags.some((f) => f.key === 'gpa')) {
    steps.push('Get the GPA on file — chances are meaningless without it.');
  }
  if (worst?.key === 'testing' && steps.length < 2) {
    steps.push('Book a diagnostic SAT/IELTS — testing is the weakest pillar.');
  }
  if (worst?.key === 'honors' && comps[0] && steps.length < 2) {
    steps.push(`Enter a credible competition — e.g. ${comps[0].name}.`);
  }
  if (worst?.key === 'activities' && steps.length < 2) {
    steps.push('Turn one activity into a led, measurable project.');
  }
  if (flags.some((f) => f.key === 'leadership') && steps.length < 2) {
    steps.push('Convert a membership into a leadership role or a self-started project.');
  }
  if (flags.some((f) => f.key === 'essay') && steps.length < 2) {
    steps.push('Start a personal-statement outline — even 200 rough words.');
  }
  if (steps.length === 0) {
    steps.push(
      comps[0]
        ? `Profile is balanced — push depth: ${comps[0].name}.`
        : 'Profile is balanced — push depth in the spike area.'
    );
  }
  return steps.slice(0, 2);
}

// Roster row datapack (shared by dashboard + CSV).
export function studentSummary(portfolio) {
  const p = portfolio || {};
  const breakdown = profileBreakdown(p);
  return {
    name: p.fullName || '—',
    grade: p.gradeLevel || '',
    major: p.intendedMajor || '',
    strength: breakdown.strength,
    pillars: breakdown.pillars,
    completeness: completeness(p),
    flags: studentFlags(p),
    steps: nextSteps(p),
  };
}
