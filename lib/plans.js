// Folio pricing — the single source of truth for plans, feature flags and
// AI-usage limits. Both the UI (pricing section, locks, upsells) and the
// server-side gates (app/api/*) read from here, so changing a price or a limit
// is a one-file edit.
//
// Plans:
//   free     — any student, no card. Full builder + chances + free AI review
//              and polish (rate-limited) + a taste of the premium AI features.
//   pro      — paid student plan. Essay coach, AI counselor, clean PDF/share,
//              generous limits.
//   business — schools & counselors. Counselor/school dashboards, org roles,
//              white-label, cohort tools; every connected student inherits Pro
//              features while they're in the org.
//
// NOTE: prices are deliberate placeholders — edit `price` fields here before
// launch. No real billing is wired; /upgrade is a stub (see REPORT.md).

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    audience: 'student',
    price: { monthly: 0, label: '$0', note: 'No card needed' },
    tagline: 'Everything you need to build an honest application.',
    features: {
      essayCoach: false, // demo taste only (1 review/day)
      aiCounselor: false, // demo taste only (3 messages/day)
      cleanPdf: false, // PDF has a "Made with Folio" footer
      cleanShare: false, // share page has a "Made with Folio" badge
      dashboards: false,
      whiteLabel: false,
      counselorAssist: false,
      csvExport: false,
      deadlineReminders: true, // basic retention stays free for everyone
    },
    bullets: [
      'Common App–style portfolio builder',
      'Honest admission chances, 100+ universities',
      'AI review & entry polishing (daily limit)',
      'Opportunities database + deadline tracking',
      'Essay coach & AI counselor — free taste',
      'Public share link (with Folio badge)',
    ],
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    audience: 'student',
    price: { monthly: 9, label: '$9/mo', note: 'Cancel anytime' },
    tagline: 'Your personal AI admissions counselor, all-in.',
    features: {
      essayCoach: true,
      aiCounselor: true,
      cleanPdf: true,
      cleanShare: true,
      dashboards: false,
      whiteLabel: false,
      counselorAssist: false,
      csvExport: false,
      deadlineReminders: true,
    },
    bullets: [
      'Everything in Free, with generous limits',
      'AI essay coach — structure, show-don’t-tell, before/after',
      'AI counselor chat — strategy, school list, next steps',
      'Clean PDF export (no watermark)',
      'Clean share link, no badge',
      'Priority AI limits',
    ],
  },

  business: {
    id: 'business',
    name: 'Business',
    audience: 'org',
    price: { monthly: null, label: 'From $6/seat/mo', note: 'Free pilot · 3 students' },
    tagline: 'The cockpit for schools and counselors.',
    features: {
      essayCoach: true,
      aiCounselor: true,
      cleanPdf: true,
      cleanShare: true,
      dashboards: true,
      whiteLabel: true,
      counselorAssist: true,
      csvExport: true,
      deadlineReminders: true,
    },
    bullets: [
      'Every connected student gets Pro features',
      'Roster with strength, gaps and attention flags',
      'Read-only student portfolios + comments',
      'Cohort analytics & CSV export',
      'White-label: your brand on portfolios & PDFs',
      'AI assistant for counselors (plans, comment drafts)',
    ],
  },
};

// Feature check for a resolved plan id.
export function planHas(planId, feature) {
  return Boolean(PLANS[planId]?.features?.[feature]);
}

// A student's effective plan: their own plan, upgraded to Pro while they are a
// member of an org on the Business plan.
export function effectiveStudentPlan({ userPlan = 'free', orgPlan = null } = {}) {
  if (userPlan === 'pro') return 'pro';
  if (orgPlan === 'business') return 'pro';
  return 'free';
}

// Per-endpoint AI rate limits by effective plan. Free tiers are the demo
// taste; pro is generous but still bounded (provider quotas are finite).
// Shape matches lib/ratelimit.js `enforce` limits.
export const AI_LIMITS = {
  // Free for everyone (the funnel) — same numbers as before the plans work.
  enhance: {
    free: { burst: { limit: 8, windowMs: 60 * 1000 }, daily: { limit: 40 } },
    pro: { burst: { limit: 12, windowMs: 60 * 1000 }, daily: { limit: 120 } },
  },
  feedback: {
    free: { burst: { limit: 4, windowMs: 60 * 1000 }, daily: { limit: 20 } },
    pro: { burst: { limit: 6, windowMs: 60 * 1000 }, daily: { limit: 40 } },
  },
  // Premium features — free gets a taste, pro gets real usage.
  essay: {
    free: { burst: { limit: 1, windowMs: 60 * 1000 }, daily: { limit: 1 } },
    pro: { burst: { limit: 3, windowMs: 60 * 1000 }, daily: { limit: 12 } },
  },
  counselor: {
    free: { burst: { limit: 3, windowMs: 60 * 1000 }, daily: { limit: 3 } },
    pro: { burst: { limit: 10, windowMs: 60 * 1000 }, daily: { limit: 80 } },
  },
  // Counselor-side AI (comment drafts, student plans) — business orgs only.
  counselorAssist: {
    free: { burst: { limit: 0, windowMs: 60 * 1000 }, daily: { limit: 0 } },
    pro: { burst: { limit: 8, windowMs: 60 * 1000 }, daily: { limit: 60 } },
  },
};

export function aiLimitsFor(endpoint, effectivePlan) {
  const cfg = AI_LIMITS[endpoint] || AI_LIMITS.enhance;
  return cfg[effectivePlan === 'pro' ? 'pro' : 'free'];
}

// Seats allowed per org plan (soft limit, enforced in the join flow + UI).
export function orgSeatLimit(org) {
  if (!org) return 0;
  if (org.plan === 'business') return org.seats || 50;
  return org.seats || 3; // free workspace = pilot: up to 3 students
}
