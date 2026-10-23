// Admit Library — real admitted applicants (data/admits.seed.json), and the
// two things the app does with them:
//   • similarAdmits(p): the closest real admits to a student's profile, for the
//     Progress page ("people like you got in here");
//   • admitsPromptBlock(p): the same records, compact, as calibration for the
//     AI review — so it judges against real files, not its idea of Harvard.
//
// Similarity is deliberately coarse: field of study, country, and the LEVEL of
// the strongest honor / activity (school → regional → national →
// international), plus test score when both sides have one. Records are few
// and hand-checked; precision beyond that would be false precision.

import seed from '@/data/admits.seed.json';
import { getUniversity, rankTier } from '@/lib/universities';
import { satEquivalent, actToSat, gradeActivity } from '@/lib/profile';

// Marks strings for the translation extractor.
const msg = (s) => s;

const LEVEL = { school: 1, local: 1, regional: 2, state: 2, national: 3, international: 4 };
export const LEVEL_LABEL = { 1: msg('School level'), 2: msg('Regional level'), 3: msg('National level'), 4: msg('International level') };

export const VERIFICATION_LABEL = {
  A: msg('Published by the university'),
  B: msg('Confirmed in national press'),
  C: msg('Self-reported'),
};

const FIELD_RES = [
  ['stem', /(math|physic|chem|bio|comput|engineer|\bcs\b|data|robot|statistic|astro|информ|математ|физик|хими|биол|инженер|программ|робот|ақпарат|математика|физика|химия|биология|инженер)/i],
  ['business', /(business|econom|financ|manage|entrepreneur|account|market|эконом|бизнес|финанс|менедж|предприним|экономика|қаржы|кәсіп)/i],
  ['social', /(politic|psycho|sociol|\blaw\b|international relations|government|public policy|anthropolog|полит|психол|социол|право|юрис|международн|саясат|құқық)/i],
  ['humanities', /(history|literat|philosoph|\bart\b|arts|music|language|linguist|design|film|истори|литерат|философ|искусств|музык|язык|лингвист|дизайн|тарих|әдебиет|өнер)/i],
];

export function fieldOf(major) {
  const s = String(major || '');
  for (const [f, re] of FIELD_RES) if (re.test(s)) return f;
  return 'unknown';
}

const isUSA = (c) => /^(usa|us|united states|сша|ақш)$/i.test(String(c || '').trim());
const isKZ = (c) => /(kazakh|казах|қазақ)/i.test(String(c || ''));
const sameCountry = (a, b) => {
  if (!a || !b) return false;
  if (isKZ(a) && isKZ(b)) return true;
  if (isUSA(a) && isUSA(b)) return true;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
};

function enrich(r) {
  const school = (x) => {
    const u = x.uniId ? getUniversity(x.uniId) : null;
    return {
      id: u?.id || null,
      name: u?.name || x.name || x.uniId,
      rank: u?.rank || null,
      tier: u?.rank ? rankTier(u.rank)?.label || null : null,
      enrolled: !!x.enrolled,
      aid: x.aid || null,
      program: x.program || null,
    };
  };
  const admitted = (r.admitted || []).map(school).sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
  const rejected = (r.rejected || []).map(school);
  const honorLevel = Math.max(0, ...(r.honors || []).map((h) => LEVEL[h.level] || 0));
  const activityLevel = Math.max(0, ...(r.activities || []).filter((a) => !/paid/i.test(a.note || '')).map((a) => LEVEL[a.level] || 0));
  const s = r.stats || {};
  const sat = Math.max(Number(s.sat) || 0, actToSat(s.act) || 0) || null;
  return { ...r, admitted, rejected, honorLevel, activityLevel, sat, bestRank: admitted[0]?.rank || null };
}

export const ADMITS = seed.records.map(enrich);

// Activity tier (1 best … 4) → the same 1–4 reach scale the records use.
const TIER_TO_LEVEL = { 1: 4, 2: 3, 3: 2, 4: 1 };

export function studentSignals(p = {}) {
  const honors = Array.isArray(p.honors) ? p.honors.filter((h) => String(h.title || '').trim()) : [];
  const acts = Array.isArray(p.activities) ? p.activities.filter((a) => a.position || a.organization || a.description) : [];
  return {
    field: fieldOf(p.intendedMajor),
    country: p.country || '',
    sat: satEquivalent(p.testing || {}) || null,
    honorLevel: Math.max(0, ...honors.map((h) => LEVEL[String(h.level || 'school').toLowerCase()] || 1)),
    activityLevel: Math.max(0, ...acts.map((a) => TIER_TO_LEVEL[gradeActivity(a).tier] || 0)),
    hasData: honors.length + acts.length > 0 || !!satEquivalent(p.testing || {}),
  };
}

const closeness = (a, b, span) => 1 - Math.min(1, Math.abs(a - b) / span);

function compare(st, r) {
  let score = 0;
  const reasons = [];
  if (st.field !== 'unknown' && st.field === r.applicant?.field) {
    score += 3;
    reasons.push('field');
  }
  if (sameCountry(st.country, r.applicant?.country)) {
    score += 2;
    reasons.push('country');
  } else if (st.country && !isUSA(st.country) && !isUSA(r.applicant?.country)) {
    score += 1;
    reasons.push('international');
  }
  const hc = closeness(st.honorLevel, r.honorLevel, 4);
  const ac = closeness(st.activityLevel, r.activityLevel, 4);
  score += hc * 3 + ac * 3;
  if (hc === 1 && r.honorLevel > 0) reasons.push('honors');
  if (ac === 1 && r.activityLevel > 0) reasons.push('activities');
  if (st.sat && r.sat) {
    const sc = closeness(st.sat, r.sat, 200);
    score += sc * 2;
    if (Math.abs(st.sat - r.sat) <= 40) reasons.push('scores');
  }
  // What this admit shows that the student does not (yet).
  const gaps = [];
  if (r.honorLevel > st.honorLevel) {
    const top = [...(r.honors || [])].sort((a, b) => (LEVEL[b.level] || 0) - (LEVEL[a.level] || 0))[0];
    gaps.push({ kind: 'honor', level: r.honorLevel, title: top?.title });
  }
  if (r.activityLevel > st.activityLevel) {
    const top = [...(r.activities || [])].filter((a) => !/paid/i.test(a.note || '')).sort((a, b) => (LEVEL[b.level] || 0) - (LEVEL[a.level] || 0))[0];
    gaps.push({ kind: 'activity', level: r.activityLevel, title: top?.title });
  }
  if (r.sat && st.sat && r.sat - st.sat >= 50) gaps.push({ kind: 'sat', value: r.sat });
  // Self-reported records rank a little lower at equal similarity.
  if (r.verification === 'C') score -= 0.5;
  return { score: Math.round(score * 10) / 10, reasons, gaps };
}

// Closest real admits to this profile. `n` records, best first.
export function similarAdmits(p, n = 3) {
  const st = studentSignals(p);
  const scored = ADMITS.map((r) => ({ record: r, ...compare(st, r) }));
  // Nothing to match on yet: show the strongest verified cases instead of
  // the "closest" ones (which would be the emptiest records).
  if (!st.hasData) {
    const peak = (r) => r.honorLevel + r.activityLevel + (r.verification === 'C' ? -3 : 0);
    return scored.sort((a, b) => peak(b.record) - peak(a.record)).slice(0, n);
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}

// What the library says about a rank band, e.g. "of 7 records with a Top 20
// admit, 5 have an international-level honor or research".
export function libraryStats(maxRank = 20) {
  const inBand = ADMITS.filter((r) => r.bestRank && r.bestRank <= maxRank);
  const count = (f) => inBand.filter(f).length;
  return {
    n: inBand.length,
    intlHonorOrResearch: count((r) => r.honorLevel === 4 || r.activityLevel === 4),
    nationalPlus: count((r) => Math.max(r.honorLevel, r.activityLevel) >= 3),
    withSat: inBand.filter((r) => r.sat).map((r) => r.sat),
  };
}

const LEVEL_WORD = { 1: 'school', 2: 'regional', 3: 'national', 4: 'international' };

function recordLine(r) {
  const schools = r.admitted
    .slice(0, 5)
    .map((s) => `${s.name}${s.program ? ` (${s.program})` : ''}${s.tier ? ` [${s.tier}]` : ''}${s.enrolled ? ' — enrolled' : ''}`)
    .join(', ');
  const rej = r.rejected.length ? ` Rejected: ${r.rejected.map((s) => s.name).join(', ')}.` : '';
  const stats = [r.stats?.sat && `SAT ${r.stats.sat}`, r.stats?.act && `ACT ${r.stats.act}`, r.stats?.apCount && `${r.stats.apCount} AP`].filter(Boolean).join(', ');
  const honors = (r.honors || []).map((h) => `${h.title} (${h.level})`).join('; ');
  const acts = (r.activities || []).map((a) => `${a.title} (${a.level}${a.note ? `; ${a.note}` : ''})`).join('; ');
  return [
    `- [${r.verification}] ${r.applicant?.country || '?'}, ${r.applicant?.school || ''}, ${r.applicant?.major || r.applicant?.field || 'major unknown'}.`,
    `  Admitted: ${schools}.${rej}`,
    stats && `  Scores: ${stats}.`,
    honors && `  Honors: ${honors}.`,
    acts && `  Activities: ${acts}.`,
    `  Peak honor level: ${LEVEL_WORD[r.honorLevel] || 'none listed'}; peak activity level: ${LEVEL_WORD[r.activityLevel] || 'none listed'}.`,
    r.lesson?.en && `  Takeaway: ${r.lesson.en}`,
  ]
    .filter(Boolean)
    .join('\n');
}

// Calibration block for the AI review prompt.
export function admitsPromptBlock(p, n = 4) {
  const st = studentSignals(p);
  const near = similarAdmits(p, n);
  const top20 = libraryStats(20);
  return `REFERENCE ADMITS — real, verified applicants most similar to this student (A = published by the university, B = national press, C = self-reported). Facts below are complete: do not add details about them.
${near.map((x) => recordLine(x.record)).join('\n')}

THIS STUDENT ON THE SAME SCALE: peak honor level ${LEVEL_WORD[st.honorLevel] || 'none'}, peak activity level ${LEVEL_WORD[st.activityLevel] || 'none'}${st.sat ? `, SAT-equivalent ${st.sat}` : ''}.

CALIBRATION FACTS (from Folio's research, Oct 2026):
- Library: ${top20.intlHonorOrResearch} of ${top20.n} records admitted to a Top 20 school have an international-level honor or selective research program; ${top20.nationalPlus} of ${top20.n} have something at national level or above.
- Mid-50% SAT of admits: <8% admit-rate schools ≈ 1510–1570; 8–20% ≈ 1430–1540; 20–45% ≈ 1270–1460; 45–70% ≈ 1090–1300 (College Scorecard).
- In 30 public self-reported profiles, applicants REJECTED by 8–20% schools had a median SAT of 1490 vs 1470 for those admitted: above ~1500, scores stop separating applicants; activities, honors and essays decide.
- Paid summer schools / pre-college programs (e.g. Harvard Summer School) show interest, not selection. Free selective programs (RSI, MIT PRIMES, SSP, MITES) and olympiads are what the reference admits actually have.`;
}
