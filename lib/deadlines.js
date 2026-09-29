// Deadline layer over the opportunities catalog — the retention engine.
//
// Honesty rule (same as everywhere in Folio): we NEVER invent exact dates.
// The catalog's `season` strings are marketing-grade; here we add machine-
// readable months for the best-known recurring opportunities, always flagged
// approximate so the UI says "≈ January · verify with the source". Items
// without an entry simply show their season text and can't be tracked — the
// field degrades gracefully.
//
// Tracked deadlines live in the portfolio (portfolio.trackedDeadlines):
//   { id, name, label, month, addedAt }
// In-app reminders = the "in N days" badges; external delivery (email/
// Telegram) is a documented follow-up — see /api/cron/reminders and REPORT.md.

import { COMPETITIONS } from '@/lib/competitions';

// month: 1–12 (approximate application/submission month, recurring yearly).
export const DEADLINE_HINTS = {
  usaco: { month: 12, label: 'First online contest' },
  'amc-aime': { month: 11, label: 'AMC 10/12 exams' },
  hmmt: { month: 11, label: 'November tournament' },
  'math-kangaroo': { month: 3, label: 'Contest day' },
  egmo: { month: 4, label: 'Olympiad (national selection earlier)' },
  usabo: { month: 2, label: 'Open exam' },
  usapho: { month: 1, label: 'F=ma exam' },
  usnco: { month: 3, label: 'Local exam' },
  'diamond-challenge': { month: 1, label: 'Concept submission' },
  'wharton-investment': { month: 9, label: 'Team registration' },
  'john-locke': { month: 6, label: 'Essay submission' },
  'jfk-essay': { month: 1, label: 'Essay deadline' },
  scholastic: { month: 12, label: 'Submission window' },
  rsi: { month: 1, label: 'Application (Dec–Jan)' },
  yygs: { month: 1, label: 'Application' },
  'coca-cola': { month: 10, label: 'Application (US seniors)' },
  isef: { month: 5, label: 'Finals — qualify via local fairs earlier' },
  'breakthrough-junior': { month: 6, label: 'Video submission' },
  conrad: { month: 11, label: 'Innovation stage opens' },
  'genius-olympiad': { month: 2, label: 'Project submission' },
  'congressional-app': { month: 11, label: 'App submission' },
  technovation: { month: 4, label: 'Project submission' },
  'regeneron-sts': { month: 11, label: 'Application (US seniors)' },
  'davidson-fellows': { month: 2, label: 'Application' },
  'mit-think': { month: 1, label: 'Proposal deadline' },
  'blue-ocean': { month: 1, label: 'Pitch submission' },
  'bow-seat': { month: 6, label: 'Submission' },
  youngarts: { month: 10, label: 'Application' },
  'meta-hacker-cup': { month: 9, label: 'Qualification round' },
  'natl-econ-challenge': { month: 4, label: 'State rounds' },
  igem: { month: 10, label: 'Jamboree (team forms in spring)' },
};

// The imported catalog (data/opportunities.csv) carries its own deadline
// month; the hand-written hints above are the fallback.
export function deadlineFor(competitionId) {
  return COMPETITIONS.find((c) => c.id === competitionId)?.deadline || DEADLINE_HINTS[competitionId] || null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Next occurrence of a recurring month-deadline. We treat the deadline as the
// END of that month (conservative: still shows as upcoming through the month
// itself, since the exact day is unknown).
export function nextOccurrence(month, now = new Date()) {
  const year =
    now.getMonth() + 1 > month ? now.getFullYear() + 1 : now.getFullYear();
  // Last day of `month` in `year`.
  return new Date(year, month, 0, 23, 59, 59);
}

export function daysUntil(date, now = new Date()) {
  return Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

// Own tables: ICU data for Kazakh is missing in some browsers (renders "M01").
const MONTHS_BY_LOCALE = {
  'ru-RU': ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  'kk-KZ': ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел'],
};

// `locale` (e.g. 'ru-RU') localises the month name; default stays English.
export function formatDeadline(month, locale) {
  const names = MONTHS_BY_LOCALE[locale] || MONTHS;
  return `≈ ${names[month - 1]}`;
}

// Marks strings for the translation extractor (scripts/i18n-check.mjs).
const msg = (s) => s;

// Translatable countdown: returns an English template + vars for t().
export function daysLeftMsg(days) {
  if (days <= 0) return [msg('due today'), {}];
  if (days === 1) return [msg('1 day left'), {}];
  if (days < 45) return [msg('{n} days left'), { n: days }];
  return [msg('~{n} mo left'), { n: Math.round(days / 30) }];
}

// Tracked list → sorted upcoming entries with day counts. `horizonDays`
// widens for younger students planning years ahead (recurring items repeat).
export function upcomingDeadlines(tracked = [], now = new Date()) {
  return tracked
    .filter((t) => t && t.month >= 1 && t.month <= 12)
    .map((t) => {
      const next = nextOccurrence(t.month, now);
      return { ...t, next, days: daysUntil(next, now) };
    })
    .sort((a, b) => a.next - b.next);
}

// Badge tone for the countdown pill.
export function urgency(days) {
  if (days <= 14) return 'band-hard-reach';
  if (days <= 45) return 'band-reach';
  return 'pill-muted';
}

// Human "time left" label for a countdown (e.g. "12 days left").
export function daysLeftLabel(days) {
  if (days <= 0) return 'due today';
  if (days === 1) return '1 day left';
  if (days < 45) return `${days} days left`;
  const months = Math.round(days / 30);
  return `~${months} month${months === 1 ? '' : 's'} left`;
}

// ---- University application deadlines ---------------------------------------
// Application ROUNDS by country. Same honesty rule as competitions: approximate
// recurring months only, always rendered with "≈ … · verify with the school".
// A university the student shortlists (portfolio.shortlist) auto-generates these
// — that's the "pull in deadlines for the schools on my list" behaviour.
const UNI_ROUNDS = {
  USA: [
    { round: 'early', month: 11, label: 'Early Action / Decision' },
    { round: 'regular', month: 1, label: 'Regular Decision' },
  ],
  UK: [{ round: 'ucas', month: 1, label: 'UCAS · Oct for Oxbridge & medicine' }],
  Canada: [{ round: 'regular', month: 1, label: 'Application deadline' }],
};
const DEFAULT_ROUNDS = [{ round: 'regular', month: 1, label: 'Application deadline' }];

export function roundsForCountry(country) {
  return UNI_ROUNDS[country] || DEFAULT_ROUNDS;
}

// Shortlisted universities → one deadline entry per application round.
export function universityDeadlines(shortlist = [], universities = []) {
  const byId = new Map(universities.map((u) => [u.id, u]));
  const out = [];
  for (const id of shortlist) {
    const u = byId.get(id);
    if (!u) continue;
    for (const r of roundsForCountry(u.country)) {
      out.push({
        key: `uni:${id}:${r.round}`,
        source: 'university',
        refId: id,
        name: u.name,
        label: r.label,
        month: r.month,
      });
    }
  }
  return out;
}

// Unified deadline list for a student: tracked competitions + application rounds
// for every shortlisted university, each with its next occurrence, a days-left
// count and a `done` flag. Completion is per CYCLE (we store the year completed),
// so a deadline marked done re-appears next year since it recurs. Sorted with
// still-open items first (soonest first), completed items last.
export function allDeadlines(portfolio = {}, universities = [], now = new Date()) {
  const done = portfolio.completedDeadlines || {};
  const comps = (portfolio.trackedDeadlines || [])
    .filter((t) => t && t.month >= 1 && t.month <= 12)
    .map((t) => ({
      key: `comp:${t.id}`,
      source: 'competition',
      refId: t.id,
      name: t.name,
      label: t.label,
      month: t.month,
    }));
  const unis = universityDeadlines(portfolio.shortlist || [], universities);

  const items = [...comps, ...unis].map((it) => {
    const next = nextOccurrence(it.month, now);
    return {
      ...it,
      next,
      days: daysUntil(next, now),
      done: done[it.key] === next.getFullYear(),
    };
  });
  items.sort((a, b) => Number(a.done) - Number(b.done) || a.next - b.next);
  return items;
}

// ---- Reminder architecture (email / push) -----------------------------------
// In-app countdowns ship today; external delivery is wired but dormant. The
// scheduled job at app/api/cron/reminders walks portfolios and, for anyone who
// opted in (portfolio.reminderPrefs), fires a reminder when a deadline crosses
// one of the lead-time thresholds below. This shape is the contract that job
// reads — the UI only has to persist it, so turning delivery on later needs no
// data migration.
export const DEFAULT_REMINDER_PREFS = {
  email: false, // deliver via email (needs a verified address + provider)
  push: false, // deliver via web push (needs a browser subscription)
  leadDays: [30, 7, 1], // fire this many days before each deadline
};

// Which lead-time reminders would fire for a deadline `days` out — used by the
// UI to preview the schedule and by the cron job to decide what to send.
export function reminderHits(days, leadDays = DEFAULT_REMINDER_PREFS.leadDays) {
  return leadDays.filter((d) => days <= d).sort((a, b) => a - b);
}
