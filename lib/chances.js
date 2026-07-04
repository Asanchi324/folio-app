// Honest admission-chance estimator. No glaze.
//
// Core idea: start from the school's real base acceptance rate, then move it up
// or down based on how the applicant compares to that school's admitted-student
// numbers (GPA, test scores, profile strength). The result is HARD-CAPPED so
// that even an outstanding applicant never sees an unrealistic number at the
// most selective schools — a near-perfect profile tops out around 25% at a
// single-digit school. Beyond that it becomes a lottery the model can't predict,
// but we leave real headroom so an exceptional applicant sees a hopeful number.

import { profileBreakdown } from '@/lib/profile';

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

// Realistic ceiling on the chance we'll ever show, as a function of how
// selective the school is. The lower the base rate, the lower the ceiling.
function chanceCeiling(acceptRate) {
  if (acceptRate <= 5) return 25; // single-digit Ivies / MIT / Stanford
  if (acceptRate <= 8) return 40;
  if (acceptRate <= 12) return 55;
  if (acceptRate <= 20) return 70;
  if (acceptRate <= 35) return 85;
  return 96; // genuine safeties
}

// Best test signal the applicant has, expressed as an SAT-equivalent so we can
// compare against the school's mid-50% SAT band.
function satEquivalent(testing = {}) {
  if (testing.sat) return Number(testing.sat);
  if (testing.act) {
    // Rough ACT→SAT concordance.
    const map = { 36: 1590, 34: 1520, 32: 1450, 30: 1390, 28: 1320, 26: 1230, 24: 1160, 22: 1090, 20: 1020 };
    const act = Math.round(Number(testing.act));
    return map[act] || clamp(1000 + (act - 20) * 35, 800, 1590);
  }
  return null;
}

export function estimateChance(profile, uni) {
  const { strength } = profileBreakdown(profile || {});

  // 1) Academic fit vs this school (GPA + test percentile within its band).
  const a = profile?.academics || {};
  const scale = Number(a.gpaScale) || 4;
  const gpa4 = a.gpa ? (scale === 4 ? Number(a.gpa) : (Number(a.gpa) / scale) * 4) : null;

  let gpaFit = 0; // -1 .. +1
  if (gpa4 != null) {
    gpaFit = clamp((gpa4 - uni.gpaAvg) / 0.5, -1, 1);
  } else {
    gpaFit = -0.45; // missing GPA is a real penalty
  }

  const satEq = satEquivalent(profile?.testing);
  let testFit = 0; // -1 .. +1
  if (satEq != null) {
    const [lo, hi] = uni.satMid;
    const mid = (lo + hi) / 2;
    testFit = clamp((satEq - mid) / ((hi - lo) || 80), -1.2, 1);
  } else if (uni.country === 'USA') {
    testFit = -0.2; // optional at many US schools, but absence still costs a bit
  }

  // 2) English requirement gate for international applicants.
  const t = profile?.testing || {};
  let englishPenalty = 0;
  const ielts = Number(t.ielts) || 0;
  const toefl = Number(t.toefl) || 0;
  if (ielts || toefl) {
    const meetsIelts = !uni.ieltsMin || ielts >= uni.ieltsMin;
    const meetsToefl = !uni.toeflMin || toefl >= uni.toeflMin;
    if (!(meetsIelts || meetsToefl)) englishPenalty = -0.5;
  }

  // 3) Overall profile strength relative to a "strong applicant" baseline (62).
  const strengthFit = clamp((strength - 62) / 30, -1, 1);

  // UK/course-based schools weight academics + tests far more than activities.
  const ukLike = uni.country === 'UK';
  const composite = ukLike
    ? gpaFit * 0.4 + testFit * 0.4 + strengthFit * 0.2 + englishPenalty
    : gpaFit * 0.28 + testFit * 0.24 + strengthFit * 0.48 + englishPenalty;

  // 4) Map composite onto a multiplier of the base rate.
  // composite -1 → ~0.08x base, 0 → ~1x, +1 → strong boost (still ceiling-capped).
  // Base 12 gives genuinely strong profiles real headroom toward the ceiling.
  const multiplier = Math.pow(12, composite); // 0.083x .. 12x
  let chance = uni.acceptRate * multiplier;

  // 5) Reality caps.
  const ceiling = chanceCeiling(uni.acceptRate);
  chance = clamp(chance, 1, ceiling);

  // Round sensibly.
  const pct = chance >= 10 ? Math.round(chance) : Math.round(chance * 10) / 10;

  return {
    chance: pct,
    ceiling,
    band: bandFor(pct, uni.acceptRate),
    factors: { gpaFit, testFit, strengthFit, englishPenalty, strength },
    reasons: buildReasons({ uni, gpa4, satEq, strength, englishPenalty, chance: pct }),
  };
}

// Plain-language explanation of WHERE a percentage comes from, so the number is
// never a black box. Each item pairs a concrete comparison (your value vs the
// school's real number) with a tone the UI can colour. This is what makes the
// odds trustworthy: the student can see the arithmetic, not just the result.
function buildReasons({ uni, gpa4, satEq, strength, englishPenalty, chance }) {
  const r = [];

  // The honest starting point: the school's own acceptance rate.
  r.push({
    tone: 'neutral',
    text: `Starts from ${uni.name}'s ${uni.acceptRate}% overall acceptance rate.`,
  });

  // GPA vs their admitted average.
  if (gpa4 != null) {
    const diff = gpa4 - uni.gpaAvg;
    const tone = diff >= 0.05 ? 'good' : diff <= -0.15 ? 'bad' : 'neutral';
    const rel = diff >= 0.05 ? 'above' : diff <= -0.05 ? 'below' : 'on par with';
    r.push({
      tone,
      text: `Your GPA ${gpa4.toFixed(2)} is ${rel} their ~${uni.gpaAvg} admitted average.`,
    });
  } else {
    r.push({ tone: 'bad', text: 'No GPA on file yet — add it for a sharper estimate.' });
  }

  // Test score vs their mid-50% band.
  if (satEq != null) {
    const [lo, hi] = uni.satMid;
    const tone = satEq >= hi ? 'good' : satEq < lo ? 'bad' : 'neutral';
    const rel = satEq >= hi ? 'at/above the top of' : satEq < lo ? 'below' : 'within';
    r.push({
      tone,
      text: `Your ~${Math.round(satEq)} SAT-equivalent is ${rel} their ${lo}–${hi} mid-50% range.`,
    });
  } else if (uni.country === 'USA') {
    r.push({
      tone: 'neutral',
      text: 'No SAT/ACT yet — many US schools are test-optional, but a score would sharpen this.',
    });
  }

  // English requirement gate for international applicants.
  if (englishPenalty < 0) {
    r.push({
      tone: 'bad',
      text: `Your English score is below ${uni.name}'s minimum — this caps your odds until it's met.`,
    });
  }

  // Overall profile strength vs a competitive baseline.
  const sTone = strength >= 70 ? 'good' : strength < 45 ? 'bad' : 'neutral';
  const sWord = strength >= 70 ? 'strong' : strength < 45 ? 'still developing' : 'solid';
  r.push({
    tone: sTone,
    text: `Overall profile strength ${strength}/100 — ${sWord} relative to competitive applicants.`,
  });

  // Why an outstanding profile still shows a modest number at the very top.
  const ceiling = chanceCeiling(uni.acceptRate);
  if (uni.acceptRate <= 8 && chance >= ceiling - 1) {
    r.push({
      tone: 'neutral',
      text: `Capped near ${ceiling}%: beyond this point admission is a lottery no model can honestly predict.`,
    });
  }

  return r;
}

// Categorise the school relative to the applicant.
function bandFor(pct, acceptRate) {
  if (pct >= 55) return 'safety';
  if (pct >= 30) return 'target';
  if (pct >= 12) return 'reach';
  return 'hard-reach';
}

export const BAND_META = {
  safety: { label: 'Safety', color: 'var(--good)' },
  target: { label: 'Target', color: 'var(--accent)' },
  reach: { label: 'Reach', color: 'var(--warn)' },
  'hard-reach': { label: 'Hard reach', color: 'var(--bad)' },
};
