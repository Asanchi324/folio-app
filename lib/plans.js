// Folio pricing — the single source of truth for plans, feature flags and
// AI-usage limits. Both the UI (pricing section, locks, upsells) and the
// server-side gates (app/api/*) read from here, so changing a price or a limit
// is a one-file edit.
//
// Student plans (users/{uid}.plan):
//   free — any student, no card. Full builder + chances + free AI review
//          and polish (rate-limited) + a taste of the premium AI features.
//   pro  — $9/mo. Essay coach, AI counselor, clean PDF/share, generous limits.
//
// Workspace plans (orgs/{orgId}.plan):
//   free         — setup state before checkout (max 3 connected students, so a
//                  school can trial the workflow before paying).
//   business     — $149/mo, up to 20 students. Full workspace.
//   businessPlus — $299/mo, up to 75 students. Full workspace at cohort scale.
//
// Every student connected to a paying workspace inherits Pro features while
// they stay connected. Billing is automated via Stripe (lib/billing.js +
// /api/billing/* + /api/webhooks/billing).

export const FOUNDER_EMAILS = ['djdjdj.9413@gmail.com'];

export function isFounder(email) {
  return Boolean(email) && FOUNDER_EMAILS.includes(String(email).toLowerCase());
}

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    audience: 'student',
    price: { monthly: 0, label: '$0', period: 'forever', note: 'No card needed' },
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
    price: { monthly: 9, label: '$9', period: '/month', note: 'Cancel anytime' },
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
      'Clean PDF export & share link, no badge',
      'Priority AI limits',
    ],
  },

  business: {
    id: 'business',
    name: 'Business',
    audience: 'org',
    price: { monthly: 149, label: '$149', period: '/month', note: 'Up to 20 students' },
    seats: 20,
    tagline: 'The complete workspace for counselors and small schools.',
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
      'Up to 20 connected students — each gets full Pro',
      'Business workspace: roster, gaps, attention flags',
      'Cohort analytics & CSV export',
      'Comments students see right in their builder',
      'White-label: your brand on portfolios & PDFs',
      'AI assistant for counselors (plans, comment drafts)',
    ],
  },

  businessPlus: {
    id: 'businessPlus',
    name: 'Business Plus',
    audience: 'org',
    price: { monthly: 299, label: '$299', period: '/month', note: 'Up to 75 students' },
    seats: 75,
    tagline: 'Whole-cohort scale for schools and larger practices.',
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
      'Up to 75 connected students — each gets full Pro',
      'Everything in Business',
      'Unlimited counselor seats',
      'Priority support & onboarding call',
      'Early access to new cohort tools',
    ],
  },
};

export const ORG_PLAN_IDS = ['business', 'businessPlus'];

export function isOrgPaidPlan(planId) {
  return ORG_PLAN_IDS.includes(planId);
}

// Feature check for a resolved plan id.
export function planHas(planId, feature) {
  return Boolean(PLANS[planId]?.features?.[feature]);
}

// A student's effective plan: their own plan, upgraded to Pro while they are a
// member of an org on a paying plan.
export function effectiveStudentPlan({ userPlan = 'free', orgPlan = null } = {}) {
  if (userPlan === 'pro') return 'pro';
  if (isOrgPaidPlan(orgPlan)) return 'pro';
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
  // Counselor-side AI (comment drafts, student plans) — paying orgs only.
  counselorAssist: {
    free: { burst: { limit: 0, windowMs: 60 * 1000 }, daily: { limit: 0 } },
    pro: { burst: { limit: 8, windowMs: 60 * 1000 }, daily: { limit: 60 } },
  },
};

export function aiLimitsFor(endpoint, effectivePlan) {
  const cfg = AI_LIMITS[endpoint] || AI_LIMITS.enhance;
  return cfg[effectivePlan === 'pro' ? 'pro' : 'free'];
}

// Student seats per org plan. The plan defines the cap; `seats` on the org doc
// is a founder-set override for custom deals.
export function orgSeatLimit(org) {
  if (!org) return 0;
  if (org.seats) return org.seats;
  if (org.plan === 'businessPlus') return PLANS.businessPlus.seats;
  if (org.plan === 'business') return PLANS.business.seats;
  return 3; // unpaid workspace = setup/trial state: up to 3 students
}

// Display label for an org plan id.
export function orgPlanLabel(planId) {
  if (planId === 'businessPlus') return 'Business Plus';
  if (planId === 'business') return 'Business';
  return 'Trial';
}
