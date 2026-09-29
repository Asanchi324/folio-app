// Daily loop — the reason to open Folio every day.
//
//   • 3 small tasks picked from THIS student's gaps (missing GPA, an activity
//     without numbers, a thin essay…). They complete themselves: the page
//     compares the portfolio against a snapshot taken at the first visit of
//     the day, so "write 100 more words" is ticked the moment it's true.
//   • A streak: a day counts when at least one of the day's tasks is done.
//   • A strength log, one point per day, for the "+4 this week" trend.
//
// State lives on the portfolio (synced like everything else):
//   portfolio.daily = {
//     base:  { date, tasks: [ids], words, honors, tracked, shortlist },
//     days:  { 'YYYY-MM-DD': { done: [taskIds] } },
//     strength: { 'YYYY-MM-DD': number },
//     pillars:  { 'YYYY-MM-DD': [academics, testing, activities, honors, essays] },
//   }
// Only the last 120 days are kept.

import { gradeActivityHeuristic } from '@/lib/profile';
import { reviewSignature } from '@/lib/review-input';

// Marks strings for the translation extractor; returns them unchanged.
const msg = (s) => s;
const KEEP_DAYS = 120;

export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Whole days since 1970 for a local YYYY-MM-DD key (used to rotate content).
export function dayNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function shiftKey(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
}

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
// Organization reads better than a generic role ("Member") in a task.
const actName = (a) => a.organization || a.position || '—';

// Everything a task needs to judge progress "since this morning".
function snapshot(p) {
  return {
    words: words(p.narrative?.personalStatement),
    honors: (p.honors || []).filter((h) => (h.title || '').trim()).length,
    tracked: (p.trackedDeadlines || []).length,
    shortlist: (p.shortlist || []).length,
  };
}

// ---- task catalogue ----------------------------------------------------------
// Each: { id, priority, text, vars, href, eligible(p), done(p, base) }.
function candidates(p) {
  const list = [];
  const acts = (p.activities || []).filter((a) => a.position || a.organization || a.description);

  if (!p.academics?.gpa) {
    list.push({ id: 'gpa', priority: 3, text: msg('Add your GPA — your odds are guesswork without it.'), href: '/portfolio', done: (q) => Boolean(q.academics?.gpa) });
  }
  if (!p.testing?.sat && !p.testing?.act) {
    list.push({ id: 'sat', priority: 3, text: msg('Add an SAT or ACT score — even a practice test result.'), href: '/portfolio', done: (q) => Boolean(q.testing?.sat || q.testing?.act) });
  }
  if (!acts.length) {
    list.push({ id: 'firstact', priority: 3, text: msg('Add your first activity — a club, a job, a project, anything.'), href: '/portfolio', done: (q) => (q.activities || []).some((a) => a.position || a.description) });
  }
  for (const a of acts) {
    const signals = gradeActivityHeuristic(a).signals.map((s) => s.key);
    if (!signals.includes('quantified') && (a.description || '').trim()) {
      list.push({
        id: `num:${a.id}`,
        priority: 2,
        text: msg('Add a number to “{name}”: people reached, money raised or a result.'),
        vars: { name: actName(a) },
        href: '/portfolio',
        done: (q) => {
          const cur = (q.activities || []).find((x) => x.id === a.id);
          return Boolean(cur) && gradeActivityHeuristic(cur).signals.some((s) => s.key === 'quantified');
        },
      });
    }
    if (!(Number(a.years) && Number(a.hours))) {
      list.push({
        id: `time:${a.id}`,
        priority: 1,
        text: msg('Add years and hours per week to “{name}”.'),
        vars: { name: actName(a) },
        href: '/portfolio',
        done: (q) => {
          const cur = (q.activities || []).find((x) => x.id === a.id);
          return Boolean(cur && Number(cur.years) && Number(cur.hours));
        },
      });
    }
  }
  if (words(p.narrative?.personalStatement) < 600) {
    list.push({ id: 'essay', priority: 2, text: msg('Write 100 more words of your personal statement.'), href: '/essay', done: (q, base) => words(q.narrative?.personalStatement) >= base.words + 100 });
  }
  if (!(p.narrative?.spike || '').trim()) {
    list.push({ id: 'spike', priority: 1, text: msg('Describe your spike in one line — what you want to be known for.'), href: '/portfolio', done: (q) => Boolean((q.narrative?.spike || '').trim()) });
  }
  if ((p.honors || []).length < 5) {
    list.push({ id: 'honor', priority: 1, text: msg('Add an honor or award — a school-level one counts too.'), href: '/portfolio', done: (q, base) => snapshot(q).honors > base.honors });
  }
  list.push({ id: 'track', priority: 1, text: msg('Find one olympiad or program and track its deadline.'), href: '/discover', done: (q, base) => snapshot(q).tracked > base.tracked });
  if ((p.shortlist || []).length < 10) {
    list.push({ id: 'uni', priority: 1, text: msg('Add a university to your list and check your odds.'), href: '/universities', done: (q, base) => snapshot(q).shortlist > base.shortlist });
  }
  const fb = p.savedFeedback;
  if (acts.length && (!fb || fb.sig !== reviewSignature(p))) {
    list.push({
      id: 'review',
      priority: 2,
      text: msg('Run your AI review to see what changed.'),
      href: '/review',
      done: (q) => Boolean(q.savedFeedback && q.savedFeedback.sig === reviewSignature(q)),
    });
  }
  return list;
}

// Pick 3 tasks for the day: top-priority gaps first, then a rotation seeded by
// the date so the plan varies from day to day.
function pickTasks(p, key) {
  const all = candidates(p);
  const seed = dayNumber(key);
  const scored = all.map((c, i) => ({ c, s: c.priority * 10 + ((seed * 7 + i * 13) % 10) }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, 3).map((x) => x.c.id);
}

// Called on each visit: starts a new day if needed. Returns the next `daily`.
export function ensureDay(p, key = dayKey()) {
  const daily = p.daily || {};
  if (daily.base?.date === key) return daily;
  return prune({
    ...daily,
    base: { date: key, tasks: pickTasks(p, key), ...snapshot(p) },
  });
}

// Today's tasks with live done-state. A task done earlier today stays done.
export function todaysTasks(p, key = dayKey()) {
  const daily = p.daily || {};
  const base = daily.base?.date === key ? daily.base : { date: key, tasks: pickTasks(p, key), ...snapshot(p) };
  const byId = new Map(candidates(p).map((c) => [c.id, c]));
  const doneBefore = new Set(daily.days?.[key]?.done || []);
  return base.tasks.map((id) => {
    const c = byId.get(id);
    if (!c) {
      // The gap no longer exists (e.g. GPA was added) — that IS done.
      return { id, text: msg('Done — this gap is closed.'), vars: {}, href: '/portfolio', done: true };
    }
    return { id, text: c.text, vars: c.vars || {}, href: c.href, done: doneBefore.has(id) || c.done(p, base) };
  });
}

// Persist newly completed tasks + today's strength point (from a
// profileBreakdown). Returns null if nothing changed, so the caller doesn't
// trigger a save loop.
export function recordProgress(p, key, breakdown) {
  const strength = breakdown.strength;
  const pillarScores = breakdown.pillars.map((x) => x.score);
  const daily = ensureDay(p, key);
  const tasks = todaysTasks({ ...p, daily }, key);
  const day = daily.days?.[key] || {};
  const done = [...new Set([...(day.done || []), ...tasks.filter((t) => t.done).map((t) => t.id)])];
  const changed =
    daily !== p.daily ||
    done.length !== (day.done || []).length ||
    daily.strength?.[key] !== strength ||
    JSON.stringify(daily.pillars?.[key]) !== JSON.stringify(pillarScores);
  if (!changed) return null;
  return prune({
    ...daily,
    days: { ...(daily.days || {}), [key]: { ...day, done } },
    strength: { ...(daily.strength || {}), [key]: strength },
    pillars: { ...(daily.pillars || {}), [key]: pillarScores },
  });
}

function active(day) {
  return Boolean(day && (day.done || []).length);
}

// Consecutive active days ending today — or ending yesterday, if today isn't
// active yet (the streak is still alive until midnight).
export function streakInfo(p, key = dayKey()) {
  const days = p.daily?.days || {};
  const todayActive = active(days[key]);
  let cursor = todayActive ? key : shiftKey(key, -1);
  let n = 0;
  while (active(days[cursor])) {
    n += 1;
    cursor = shiftKey(cursor, -1);
  }
  let best = 0;
  let run = 0;
  const sorted = Object.keys(days).sort();
  let prev = null;
  for (const k of sorted) {
    if (!active(days[k])) {
      run = 0;
      prev = k;
      continue;
    }
    run = prev && shiftKey(prev, 1) === k && run ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  const tasksDone = Object.values(days).reduce((sum, d) => sum + (d.done || []).length, 0);
  return { streak: n, todayActive, best: Math.max(best, n), tasksDone };
}

// Last `n` days (oldest → newest) for the activity strip.
export function recentDays(p, key = dayKey(), n = 14) {
  const days = p.daily?.days || {};
  return Array.from({ length: n }, (_, i) => {
    const k = shiftKey(key, i - n + 1);
    return { key: k, active: active(days[k]), today: k === key };
  });
}

// Strength points for the trend chart, plus the change over 7 days.
export function strengthTrend(p, key = dayKey(), n = 30) {
  const log = p.daily?.strength || {};
  const points = Object.keys(log)
    .filter((k) => k <= key)
    .sort()
    .slice(-n)
    .map((k) => ({ key: k, v: log[k] }));
  const weekAgo = shiftKey(key, -7);
  const older = points.filter((x) => x.key <= weekAgo).pop() || points[0];
  const last = points[points.length - 1];
  return { points, delta: last && older ? last.v - older.v : 0 };
}

function prune(daily) {
  const cutoff = shiftKey(dayKey(), -KEEP_DAYS);
  const trim = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => k >= cutoff));
  return { ...daily, days: trim(daily.days), strength: trim(daily.strength), pillars: trim(daily.pillars) };
}

// Pillar scores at the first logged day vs now (index-aligned with PILLARS).
export function pillarChange(p) {
  const log = p.daily?.pillars || {};
  const keys = Object.keys(log).sort();
  if (keys.length < 2) return null;
  const first = log[keys[0]];
  const last = log[keys[keys.length - 1]];
  return { since: keys[0], diff: last.map((v, i) => v - (first[i] ?? v)) };
}
