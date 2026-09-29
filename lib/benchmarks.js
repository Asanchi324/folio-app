// "Ideal portfolio" benchmarks — what a strong admit looks like for a tier of
// schools. Derived from the university dataset (real acceptance rates, mid-50%
// SAT ranges, admitted GPA, English minimums) plus the same scoring model the
// app uses everywhere, so the target is consistent with the odds shown on
// /universities. It is a benchmark, not a person.

import { UNIVERSITIES } from '@/lib/universities';
import { academicsScore, testingScore, activityAssessments, honorAssessments, profileBreakdown, satEquivalent, gpaOn4 } from '@/lib/profile';
import { ecBar } from '@/lib/chances';

// Marks strings for the translation extractor.
const msg = (s) => s;

export const TIERS = [
  { id: 'top10', label: msg('Most selective US (under 8%)'), test: (u) => u.country === 'USA' && u.acceptRate < 8 },
  { id: 'top30', label: msg('Highly selective US (8–20%)'), test: (u) => u.country === 'USA' && u.acceptRate >= 8 && u.acceptRate < 20 },
  { id: 'selective', label: msg('Selective US (20–45%)'), test: (u) => u.country === 'USA' && u.acceptRate >= 20 && u.acceptRate < 45 },
  { id: 'uk', label: msg('Top UK universities'), test: (u) => u.country === 'UK' },
  { id: 'canada', label: msg('Top Canadian universities'), test: (u) => u.country === 'Canada' },
];

function median(xs) {
  const a = xs.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

const round10 = (x) => Math.round(x / 10) * 10;
const roundHalf = (x) => Math.round(x * 2) / 2;

// Benchmark for one tier. "Ideal" = the upper end of the admitted class
// (75th-percentile SAT, admitted-average GPA, comfortably above the English
// minimum), and activities/honors above the school's EC bar.
export function benchmark(tierId) {
  const tier = TIERS.find((t) => t.id === tierId) || TIERS[1];
  const schools = UNIVERSITIES.filter(tier.test);
  const rate = median(schools.map((u) => u.acceptRate)) ?? 20;
  const sat = round10(median(schools.map((u) => u.satMid?.[1])) ?? 1450);
  const gpa = Math.round((median(schools.map((u) => u.gpaAvg)) ?? 3.8) * 100) / 100;
  const ielts = roundHalf(Math.max(7, (median(schools.map((u) => u.ieltsMin)) ?? 6.5) + 0.5));

  // Run the ideal numbers through the same model the student is scored with.
  const ideal = { academics: { gpa: String(gpa), gpaScale: '4' }, testing: { sat: String(sat), ielts: String(ielts) } };
  const bar = ecBar(rate);
  return {
    tier,
    schools: schools.length,
    sampleNames: schools.slice(0, 4).map((u) => u.name),
    rate,
    sat,
    gpa,
    ielts,
    pillars: {
      academics: academicsScore(ideal),
      testing: testingScore(ideal),
      activities: Math.min(95, Math.round(bar + 12)),
      honors: Math.min(95, Math.round(bar - 5)),
      essays: rate < 20 ? 80 : 60,
    },
    // Concrete shape of the activity list at this level.
    strongActivities: rate < 8 ? 3 : rate < 20 ? 2 : 1,
    minActivities: rate < 20 ? 8 : 6,
    honorLevel: rate < 8 ? 'national' : rate < 20 ? 'regional' : 'school',
  };
}

// Suggest a tier from the student's list (most selective school they saved).
export function suggestedTier(p) {
  const saved = UNIVERSITIES.filter((u) => (p.shortlist || []).includes(u.id));
  if (!saved.length) return 'top30';
  const hardest = saved.reduce((a, b) => (a.acceptRate < b.acceptRate ? a : b));
  return (TIERS.find((t) => t.test(hardest)) || TIERS[1]).id;
}

const HONOR_RANK = { school: 1, regional: 2, state: 2, national: 3, international: 4 };

// Side-by-side comparison + checklist for the UI.
export function compareToBenchmark(p, b) {
  const t = p.testing || {};
  const satEq = satEquivalent(t);
  const gpa4 = gpaOn4(p.academics);
  const ielts = Number(t.ielts) || null;
  const acts = activityAssessments(p).filter((g) => g.score > 0);
  const strong = acts.filter((g) => g.tier <= 2).length;
  const honors = (p.honors || []).filter((h) => (h.title || '').trim());
  const bestHonor = Math.max(0, ...honors.map((h) => HONOR_RANK[h.level] || 1));
  const honorOk = bestHonor >= HONOR_RANK[b.honorLevel] && honorAssessments({ honors }).some((g) => g.score >= 40);
  const words = String(p.narrative?.personalStatement || '').trim().split(/\s+/).filter(Boolean).length;

  // Same pillar scores as the Assessment page, so the numbers line up.
  const pillarScores = Object.fromEntries(profileBreakdown(p).pillars.map((x) => [x.key, x.score]));

  const checks = [
    { key: 'gpa', text: msg('GPA {target}+ (on a 4.0 scale)'), vars: { target: b.gpa.toFixed(2) }, yours: gpa4 != null ? gpa4.toFixed(2) : '—', ok: gpa4 != null && gpa4 >= b.gpa - 0.02 },
    { key: 'sat', text: msg('SAT {target}+ (or ACT equivalent)'), vars: { target: b.sat }, yours: satEq ?? '—', ok: satEq != null && satEq >= b.sat - 10 },
    { key: 'ielts', text: msg('IELTS {target}+ (or TOEFL equivalent)'), vars: { target: b.ielts }, yours: ielts ?? (t.toefl ? `TOEFL ${t.toefl}` : '—'), ok: (ielts != null && ielts >= b.ielts) || Number(t.toefl) >= 100 },
    { key: 'strong', text: msg('{n} activities at Tier 1–2 (leadership with measurable results)'), vars: { n: b.strongActivities }, yours: strong, ok: strong >= b.strongActivities },
    { key: 'count', text: msg('At least {n} activities listed'), vars: { n: b.minActivities }, yours: acts.length, ok: acts.length >= b.minActivities },
    {
      key: 'honor',
      text: b.honorLevel === 'national' ? msg('A national or international honor') : b.honorLevel === 'regional' ? msg('A regional-level honor or higher') : msg('At least one honor'),
      vars: {},
      yours: honors.length,
      ok: honorOk,
    },
    { key: 'essay', text: msg('Personal statement of 450–650 words'), vars: {}, yours: words, ok: words >= 450 && words <= 650 },
    { key: 'spike', text: msg('A clear spike — one theme your activities build toward'), vars: {}, yours: (p.narrative?.spike || '').trim() ? '✓' : '—', ok: Boolean((p.narrative?.spike || '').trim()) },
  ];
  return { checks, pillarScores, met: checks.filter((c) => c.ok).length };
}
