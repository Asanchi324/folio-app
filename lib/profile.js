// Profile strength model. Turns a portfolio into a 0–100 "profile strength"
// plus per-pillar sub-scores. Deliberately conservative: maxing one pillar does
// not max the total, because top schools want breadth + depth, not a single
// inflated number. These sub-scores feed both the dashboard rings and the
// honest chance estimator in chances.js.

const LEVEL_WEIGHT = {
  international: 1.0,
  national: 0.75,
  state: 0.45,
  regional: 0.45,
  school: 0.2,
};

// ---- individual pillars (each returns 0..100) ----

export function academicsScore(p) {
  const a = p.academics || {};
  let gpa = Number(a.gpa);
  const scale = Number(a.gpaScale) || 4;
  if (!gpa) return 0;
  // Normalise to a 4.0 scale.
  const gpa4 = scale === 4 ? gpa : (gpa / scale) * 4;
  // 3.0 → ~40, 3.7 → ~75, 4.0 → 100.
  const score = Math.max(0, Math.min(100, (gpa4 - 2.5) * (100 / 1.5)));
  return Math.round(score);
}

export function testingScore(p) {
  const t = p.testing || {};
  const parts = [];
  if (t.sat) {
    // 1000 → ~10, 1400 → ~70, 1600 → 100.
    parts.push(Math.max(0, Math.min(100, ((Number(t.sat) - 900) / 700) * 100)));
  }
  if (t.act) {
    parts.push(Math.max(0, Math.min(100, ((Number(t.act) - 18) / 18) * 100)));
  }
  if (t.ielts) {
    // 6.0 → 40, 7.5 → 85, 9.0 → 100.
    parts.push(Math.max(0, Math.min(100, ((Number(t.ielts) - 5) / 4) * 100)));
  }
  if (t.toefl) {
    parts.push(Math.max(0, Math.min(100, ((Number(t.toefl) - 60) / 60) * 100)));
  }
  if (Array.isArray(t.apScores) && t.apScores.length) {
    const avg =
      t.apScores.reduce((s, x) => s + (Number(x.score) || 0), 0) /
      t.apScores.length;
    parts.push(Math.min(100, (avg / 5) * 100));
  }
  if (!parts.length) return 0;
  return Math.round(parts.reduce((s, x) => s + x, 0) / parts.length);
}

export function activitiesScore(p) {
  const acts = Array.isArray(p.activities) ? p.activities : [];
  if (!acts.length) return 0;
  let total = 0;
  for (const a of acts) {
    let v = 12; // base value for any meaningful activity
    const pos = (a.position || '').toLowerCase();
    if (/found|president|captain|lead|director|ceo|editor-in-chief/.test(pos))
      v += 10;
    else if (/head|chair|manager|coordinator|organi/.test(pos)) v += 6;
    const yrs = Number(a.years) || 0;
    if (yrs >= 3) v += 6;
    else if (yrs >= 2) v += 3;
    if ((a.description || '').length > 120) v += 3; // substance signal
    total += Math.min(v, 22);
  }
  // Diminishing returns: 10 great activities ≈ cap.
  return Math.round(Math.min(100, total * 0.72));
}

export function honorsScore(p) {
  const honors = Array.isArray(p.honors) ? p.honors : [];
  if (!honors.length) return 0;
  let total = 0;
  for (const h of honors) {
    const w = LEVEL_WEIGHT[(h.level || 'school').toLowerCase()] ?? 0.2;
    total += w * 35;
  }
  return Math.round(Math.min(100, total));
}

export function essaysScore(p) {
  // Soft pillar — we can't grade essays here, but we reward that they exist and
  // have length, plus intended-major clarity. Caps low so it never dominates.
  const e = p.narrative || {};
  let s = 0;
  if ((e.personalStatement || '').length > 400) s += 55;
  else if ((e.personalStatement || '').length > 100) s += 25;
  if ((p.intendedMajor || '').trim()) s += 20;
  if ((e.spike || '').trim()) s += 25;
  return Math.min(100, s);
}

// ---- aggregate ----

export const PILLARS = [
  { key: 'academics', label: 'Academics', weight: 0.26, fn: academicsScore },
  { key: 'testing', label: 'Testing', weight: 0.2, fn: testingScore },
  {
    key: 'activities',
    label: 'Extracurriculars',
    weight: 0.27,
    fn: activitiesScore,
  },
  { key: 'honors', label: 'Honors & Awards', weight: 0.18, fn: honorsScore },
  { key: 'essays', label: 'Narrative', weight: 0.09, fn: essaysScore },
];

export function profileBreakdown(p) {
  const pillars = PILLARS.map((pl) => ({
    key: pl.key,
    label: pl.label,
    weight: pl.weight,
    score: pl.fn(p || {}),
  }));
  const strength = Math.round(
    pillars.reduce((s, pl) => s + pl.score * pl.weight, 0)
  );
  return { strength, pillars };
}

// % of the portfolio that's filled in — drives onboarding nudges.
export function completeness(p) {
  if (!p) return 0;
  const checks = [
    !!(p.fullName || '').trim(),
    !!(p.intendedMajor || '').trim(),
    !!p.academics?.gpa,
    !!(p.testing?.sat || p.testing?.act),
    !!(p.testing?.ielts || p.testing?.toefl),
    (p.activities || []).length >= 1,
    (p.activities || []).length >= 4,
    (p.honors || []).length >= 1,
    !!(p.narrative?.personalStatement || '').trim(),
    !!(p.narrative?.spike || '').trim(),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
