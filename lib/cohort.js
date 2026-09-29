// Pure cohort maths for the Business Workspace — no React, no Firestore, so
// it can be unit-tested with plain Node. lib/workspace.js re-exports it.

import { stepToString } from '@/lib/insights';
import { estimateChance } from '@/lib/chances';
import { getUniversity } from '@/lib/universities';
import { profileBreakdown, satEquivalent } from '@/lib/profile';
import { dayKey, streakInfo } from '@/lib/daily';


// Per-student signals the cohort tools need beyond the summary: tests, the
// school list with estimated bands, the strength history and the streak.
export function cohortSignals(data) {
  const p = data || {};
  const t = p.testing || {};
  const breakdown = profileBreakdown(p);
  const list = (p.shortlist || [])
    .map((id) => getUniversity(id))
    .filter(Boolean)
    .map((u) => ({ id: u.id, name: u.name, rank: u.rank, band: estimateChance(p, u, breakdown).band }));
  let streak = { streak: 0, tasksDone: 0 };
  try {
    streak = streakInfo(p, dayKey());
  } catch { /* no daily data */ }
  return {
    sat: satEquivalent(t) || null,
    english: Number(t.ielts) || (Number(t.toefl) ? Number(t.toefl) : null),
    englishKind: Number(t.ielts) ? 'ielts' : Number(t.toefl) ? 'toefl' : null,
    list,
    history: p.daily?.strength || {},
    streak: streak.streak || 0,
    tasksDone: streak.tasksDone || 0,
  };
}

// Spread `newIds` across `staffIds` so everyone ends with a similar load.
// Returns { studentUid: counselorUid }.
export function balancedAssignment(newIds, staffIds, allStudents = []) {
  const load = Object.fromEntries(staffIds.map((id) => [id, 0]));
  for (const m of allStudents) if (m.counselorUid && m.counselorUid in load) load[m.counselorUid] += 1;
  const out = {};
  for (const uid of newIds) {
    const next = staffIds.reduce((a, b) => (load[b] < load[a] ? b : a));
    out[uid] = next;
    load[next] += 1;
  }
  return out;
}

// Cohort strength over time: for each day, the average of the latest known
// strength of every student who had one by then. Returns [{ key, v }].
export function cohortTrend(rows, days = 60) {
  const today = dayKey();
  const keys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(dayKey(d));
  }
  const series = rows.map((r) => Object.entries(r.history || {}).sort(([a], [b]) => (a < b ? -1 : 1)));
  const out = [];
  for (const k of keys) {
    let sum = 0;
    let n = 0;
    for (const s of series) {
      let v = null;
      for (const [dk, val] of s) {
        if (dk <= k) v = val;
        else break;
      }
      if (v != null) {
        sum += v;
        n += 1;
      }
    }
    if (n) out.push({ key: k, v: Math.round(sum / n), n });
  }
  // Drop the leading flat stretch before most students had any history.
  return out.filter((x) => x.key <= today);
}

// Display name for a roster row (portfolio name wins, then membership).
export function rowName(r) {
  return r.summary.name === '—' ? r.displayName || r.email || 'Student' : r.summary.name;
}

// Cohort aggregates for Overview + Analytics.
export function cohortStats(rows) {
  const n = rows.length;
  if (!n) {
    return {
      n: 0, avgStrength: 0, avgCompleteness: 0, needsAttention: 0,
      bands: { weak: 0, developing: 0, solid: 0, strong: 0 },
      flagCounts: [], grades: {}, active7: 0, active30: 0, deadlinesSoon: [],
      satBuckets: { none: 0, lt1200: 0, s1200: 0, s1350: 0, s1450: 0 }, englishReady: 0, englishMissing: 0,
      listBands: { safety: 0, target: 0, reach: 0, 'hard-reach': 0 }, topSchools: [], noList: 0, onlyReach: 0, streaking: 0,
    };
  }
  const now = Date.now();
  const bands = { weak: 0, developing: 0, solid: 0, strong: 0 };
  const flagMap = new Map();
  const grades = {};
  let strengthSum = 0;
  let completenessSum = 0;
  let needsAttention = 0;
  let active7 = 0;
  let active30 = 0;
  const deadlinesSoon = [];

  for (const r of rows) {
    const s = r.summary;
    strengthSum += s.strength;
    completenessSum += s.completeness;
    if (s.flags.some((f) => f.severity === 'bad')) needsAttention += 1;
    if (s.strength >= 75) bands.strong += 1;
    else if (s.strength >= 50) bands.solid += 1;
    else if (s.strength >= 30) bands.developing += 1;
    else bands.weak += 1;
    for (const f of s.flags) flagMap.set(f.label, (flagMap.get(f.label) || 0) + 1);
    const g = s.grade || '—';
    grades[g] = (grades[g] || 0) + 1;
    if (r.updatedAt) {
      const age = now - r.updatedAt;
      if (age <= 7 * 864e5) active7 += 1;
      if (age <= 30 * 864e5) active30 += 1;
    }
    for (const d of r.deadlines) {
      if (d.days <= 60) deadlinesSoon.push({ ...d, student: rowName(r), uid: r.uid });
    }
  }
  deadlinesSoon.sort((a, b) => a.days - b.days);

  // Testing readiness.
  const satBuckets = { none: 0, lt1200: 0, s1200: 0, s1350: 0, s1450: 0 };
  let englishReady = 0;
  let englishMissing = 0;
  // School lists: band mix across every shortlisted school, most common targets.
  const listBands = { safety: 0, target: 0, reach: 0, 'hard-reach': 0 };
  const schoolMap = new Map();
  let noList = 0;
  let onlyReach = 0;
  let streaking = 0;
  for (const r of rows) {
    const v = r.sat;
    if (!v) satBuckets.none += 1;
    else if (v < 1200) satBuckets.lt1200 += 1;
    else if (v < 1350) satBuckets.s1200 += 1;
    else if (v < 1450) satBuckets.s1350 += 1;
    else satBuckets.s1450 += 1;
    if (!r.english) englishMissing += 1;
    else if ((r.englishKind === 'ielts' && r.english >= 6.5) || (r.englishKind === 'toefl' && r.english >= 90)) englishReady += 1;
    const list = r.list || [];
    if (!list.length) noList += 1;
    else if (!list.some((u) => u.band === 'safety' || u.band === 'target')) onlyReach += 1;
    for (const u of list) {
      listBands[u.band] = (listBands[u.band] || 0) + 1;
      const e = schoolMap.get(u.id) || { id: u.id, name: u.name, rank: u.rank, n: 0 };
      e.n += 1;
      schoolMap.set(u.id, e);
    }
    if (r.streak > 0) streaking += 1;
  }
  const topSchools = [...schoolMap.values()].sort((a, b) => b.n - a.n || (a.rank || 999) - (b.rank || 999)).slice(0, 8);

  return {
    n,
    avgStrength: Math.round(strengthSum / n),
    avgCompleteness: Math.round(completenessSum / n),
    needsAttention,
    bands,
    flagCounts: [...flagMap.entries()].sort((a, b) => b[1] - a[1]),
    grades,
    active7,
    active30,
    deadlinesSoon,
    satBuckets,
    englishReady,
    englishMissing,
    listBands,
    topSchools,
    noList,
    onlyReach,
    streaking,
  };
}

// Load and outcome per counselor (plus an "unassigned" bucket, uid null).
export function counselorLoad(rows, staff, quietDays = 14) {
  const by = new Map(staff.map((m) => [m.uid, []]));
  const none = [];
  for (const r of rows) {
    if (r.counselorUid && by.has(r.counselorUid)) by.get(r.counselorUid).push(r);
    else none.push(r);
  }
  const pack = (member, list) => ({
    member,
    uid: member?.uid || null,
    n: list.length,
    avgStrength: list.length ? Math.round(list.reduce((s, r) => s + r.summary.strength, 0) / list.length) : null,
    attention: list.filter((r) => r.summary.flags.some((f) => f.severity === 'bad')).length,
    inactive: list.filter((r) => !r.updatedAt || Date.now() - r.updatedAt > quietDays * 864e5).length,
    rows: list,
  });
  return { counselors: staff.map((m) => pack(m, by.get(m.uid))), unassigned: pack(null, none) };
}

// Roster CSV (paid feature — caller gates).
export function rosterCsv(rows, staff = []) {
  const names = Object.fromEntries(staff.map((m) => [m.uid, m.displayName || m.email || '']));
  const head = ['Name', 'Email', 'Counselor', 'Grade', 'Major', 'Strength', 'Completeness %', 'SAT (or ACT equiv.)', 'Schools on list', 'Flags', 'Next steps', 'Last active'];
  const lines = rows.map((r) => {
    const s = r.summary;
    return [
      rowName(r),
      r.email || '',
      names[r.counselorUid] || '',
      s.grade,
      s.major,
      s.strength,
      s.completeness,
      r.sat || '',
      (r.list || []).map((u) => u.name).join('; '),
      s.flags.map((f) => f.label).join('; '),
      s.steps.map(stepToString).join('; '),
      r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : '',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });
  return '﻿' + [head.join(','), ...lines].join('\n');
}
