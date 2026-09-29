// Honest admission-chance estimator. No glaze.
//
// Start from the school's real acceptance rate, then move it up or down by how
// the applicant compares to THAT school's admitted class on three axes:
//   • academics — GPA vs the school's admitted average,
//   • testing   — SAT/ACT position inside the school's mid-50% band (a score
//                 below the 25th percentile at a selective school is a real
//                 problem; one at the 75th+ is a real plus),
//   • activities & honors — graded quality (lib/profile.js) vs the bar THIS
//                 school sets. A 4% school expects national-level distinction;
//                 a 50% school doesn't.
// The result is hard-capped by selectivity: a near-perfect profile tops out
// around 25% at a single-digit school — past that it's a lottery.
//
// Reasons are returned as English templates + vars (msg()), translated in the UI.

import { profileBreakdown, gpaOn4, satEquivalent } from '@/lib/profile';

// Marks a string for the translation extractor; returns it unchanged.
export const msg = (s) => s;

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

// Realistic ceiling on the chance we'll ever show, by selectivity.
function chanceCeiling(acceptRate) {
  if (acceptRate <= 5) return 25;
  if (acceptRate <= 8) return 40;
  if (acceptRate <= 12) return 55;
  if (acceptRate <= 20) return 70;
  if (acceptRate <= 35) return 85;
  return 96;
}

// The extracurricular/honors level (0–100, same scale as the pillars) that a
// typical admit at this school shows. Harvard ≈ 65, a 20% school ≈ 48, 50% ≈ 22.
export function ecBar(acceptRate) {
  return clamp(68 - acceptRate * 1.0, 22, 66);
}

export function estimateChance(profile, uni) {
  const p = profile || {};
  const { strength, pillars } = profileBreakdown(p);
  const pillar = (k) => pillars.find((x) => x.key === k)?.score || 0;
  const selective = uni.acceptRate <= 15;

  // 1) GPA vs admitted average.
  const gpa4 = gpaOn4(p.academics);
  const gpaFit = gpa4 != null ? clamp((gpa4 - uni.gpaAvg) / 0.35, -1.2, 1) : -0.6;

  // 2) Test position within the school's mid-50% band: 25th pct → -0.5,
  //    median → 0, 75th pct → +0.5, beyond scales on.
  const satEq = satEquivalent(p.testing);
  const [lo, hi] = uni.satMid;
  const mid = (lo + hi) / 2;
  const half = Math.max(30, (hi - lo) / 2);
  let testFit = 0;
  if (satEq != null) {
    testFit = clamp(((satEq - mid) / half) * 0.5, -1.4, 1);
    // Far below the band at a selective school is close to disqualifying.
    if (selective && satEq < lo - 100) testFit = Math.min(testFit, -1.3);
  } else if (uni.country === 'USA') {
    // Many selective US schools require tests again; elsewhere optional.
    testFit = selective ? -0.45 : -0.15;
  }

  // 3) English requirement gate for international applicants.
  const t = p.testing || {};
  let englishPenalty = 0;
  const ielts = Number(t.ielts) || 0;
  const toefl = Number(t.toefl) || 0;
  if (ielts || toefl) {
    const meets = (uni.ieltsMin && ielts >= uni.ieltsMin) || (uni.toeflMin && toefl >= uni.toeflMin);
    if (!meets) englishPenalty = -0.5;
  }

  // 4) Activities + honors + narrative vs this school's bar.
  const ec = pillar('activities') * 0.62 + pillar('honors') * 0.28 + pillar('essays') * 0.1;
  const bar = ecBar(uni.acceptRate);
  const ecFit = clamp((ec - bar) / 22, -1.2, 1);

  const ukLike = uni.country === 'UK';
  const composite = ukLike
    ? gpaFit * 0.42 + testFit * 0.38 + ecFit * 0.2 + englishPenalty
    : gpaFit * 0.3 + testFit * 0.25 + ecFit * 0.45 + englishPenalty;

  // Scale the ODDS, not the rate — multiplying a 40% rate by 2.4 would blow
  // past 90%, while odds saturate naturally. composite 0 = "looks like a
  // typical admit", which beats the raw base rate (averaged over ALL
  // applicants, most of them weaker): odds ×2.4. -1 → ×0.2, +1 → ×30.
  const base = uni.acceptRate / 100;
  const odds = (base / (1 - base)) * Math.pow(12, composite + 0.35);
  let chance = (odds / (1 + odds)) * 100;
  const ceiling = chanceCeiling(uni.acceptRate);
  chance = clamp(chance, 0.5, ceiling);
  const pct = chance >= 10 ? Math.round(chance) : Math.round(chance * 10) / 10;

  return {
    chance: pct,
    ceiling,
    band: bandFor(pct),
    factors: { gpaFit, testFit, ecFit, englishPenalty, strength },
    reasons: buildReasons({ uni, gpa4, satEq, ec, bar, englishPenalty, chance: pct, ceiling }),
  };
}

function buildReasons({ uni, gpa4, satEq, ec, bar, englishPenalty, chance, ceiling }) {
  const r = [];
  r.push({
    tone: 'neutral',
    text: msg("Starts from {name}'s {rate}% overall acceptance rate."),
    vars: { name: uni.name, rate: uni.acceptRate },
  });

  if (gpa4 != null) {
    const diff = gpa4 - uni.gpaAvg;
    r.push({
      tone: diff >= 0.03 ? 'good' : diff <= -0.12 ? 'bad' : 'neutral',
      text:
        diff >= 0.03
          ? msg('Your GPA {gpa} is above their ~{avg} admitted average.')
          : diff <= -0.03
            ? msg('Your GPA {gpa} is below their ~{avg} admitted average.')
            : msg('Your GPA {gpa} is on par with their ~{avg} admitted average.'),
      vars: { gpa: gpa4.toFixed(2), avg: uni.gpaAvg },
    });
  } else {
    r.push({ tone: 'bad', text: msg('No GPA on file yet — add it for a sharper estimate.') });
  }

  const [lo, hi] = uni.satMid;
  if (satEq != null) {
    r.push({
      tone: satEq >= hi ? 'good' : satEq < lo ? 'bad' : 'neutral',
      text:
        satEq >= hi
          ? msg('Your ~{sat} SAT-equivalent is at or above the top of their {lo}–{hi} mid-50% range.')
          : satEq < lo
            ? msg('Your ~{sat} SAT-equivalent is below their {lo}–{hi} mid-50% range.')
            : msg('Your ~{sat} SAT-equivalent is within their {lo}–{hi} mid-50% range.'),
      vars: { sat: Math.round(satEq), lo, hi },
    });
  } else if (uni.country === 'USA') {
    r.push({
      tone: uni.acceptRate <= 15 ? 'bad' : 'neutral',
      text: msg('No SAT/ACT yet — at selective US schools a strong score is expected.'),
    });
  }

  if (englishPenalty < 0) {
    r.push({
      tone: 'bad',
      text: msg("Your English score is below {name}'s minimum — this caps your odds until it's met."),
      vars: { name: uni.name },
    });
  }

  r.push({
    tone: ec >= bar + 5 ? 'good' : ec < bar - 12 ? 'bad' : 'neutral',
    text: msg('Activities & awards rate {ec}/100; admits here typically show about {bar}.'),
    vars: { ec: Math.round(ec), bar: Math.round(bar) },
  });

  if (uni.acceptRate <= 8 && chance >= ceiling - 1) {
    r.push({
      tone: 'neutral',
      text: msg('Capped near {ceiling}%: beyond this point admission is a lottery no model can honestly predict.'),
      vars: { ceiling },
    });
  }
  return r;
}

function bandFor(pct) {
  if (pct >= 55) return 'safety';
  if (pct >= 30) return 'target';
  if (pct >= 12) return 'reach';
  return 'hard-reach';
}

export const BAND_META = {
  safety: { label: 'Safety', color: 'var(--good)' },
  target: { label: 'Target', color: 'var(--primary)' },
  reach: { label: 'Reach', color: 'var(--warn)' },
  'hard-reach': { label: 'Hard reach', color: 'var(--bad)' },
};
