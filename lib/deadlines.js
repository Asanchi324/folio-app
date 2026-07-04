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

export function deadlineFor(competitionId) {
  return DEADLINE_HINTS[competitionId] || null;
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

export function formatDeadline(month) {
  return `≈ ${MONTHS[month - 1]}`;
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
