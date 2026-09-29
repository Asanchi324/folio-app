// Profile strength model. Turns a portfolio into a 0–100 "profile strength"
// plus per-pillar sub-scores, and — for extracurriculars and honors — a graded
// assessment of EVERY entry, so the score reflects quality, not quantity.
//
// Principles:
//   • Scores are calibrated to where admitted classes actually sit. A 1200 SAT
//     and a 1550 SAT are worlds apart (≈ 75th vs ≈ 99th percentile), so they
//     must land far apart here — not be averaged away with an IELTS score.
//   • An activity is graded on what it shows: role, scope, measurable impact,
//     commitment and distinction. "Member of a club" and "founded a nonprofit
//     that served 400 students" are different tiers, and the pillar is
//     weighted toward the TOP activities (depth beats a long list).
//   • When the AI grader has assessed an activity (activity.aiGrade, stamped
//     with a signature of the exact text it read), its score replaces the
//     heuristic for that entry. Edit the activity and the grade goes stale.
//
// Everything here is pure and deterministic — used by the builder, the review
// page, the chances model, the counselor roster and the server prompts.

// ---------------------------------------------------------------- utilities

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

// Piecewise-linear interpolation through [x, y] points (x ascending).
function curve(x, points) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return points[points.length - 1][1];
}

function num(v) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// Weighted "top-heavy" aggregate: the best entry counts most, then the next…
function topWeighted(scores, weights) {
  const sorted = [...scores].sort((a, b) => b - a);
  let total = 0;
  for (let i = 0; i < weights.length; i++) total += (sorted[i] || 0) * weights[i];
  return total;
}

// Small stable hash (djb2) — fingerprints an entry's text for AI-grade staleness.
export function entrySignature(parts) {
  const s = parts.map((x) => String(x ?? '').trim()).join('␟');
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h.toString(36);
}

export function activitySignature(a = {}) {
  return entrySignature([a.position, a.organization, a.description, a.years, a.hours]);
}

// ---------------------------------------------------------------- academics

// Normalise GPA to a 4.0 scale. 5-point (common in KZ/RU schools) and
// 100-point scales map linearly.
export function gpaOn4(a = {}) {
  const gpa = num(a.gpa);
  if (!gpa) return null;
  const scale = num(a.gpaScale) || 4;
  return clamp(scale === 4 ? gpa : (gpa / scale) * 4, 0, 4.3);
}

// Count rigorous courses mentioned in the free-text rigor field.
function rigorCount(text = '') {
  const s = String(text);
  const explicit = s.match(/(\d+)\s*(ap|ib|a[- ]?levels?|honou?rs|hl)\b/gi) || [];
  let n = explicit.reduce((acc, m) => acc + num(m.match(/\d+/)[0]), 0);
  if (!n) n = (s.match(/\b(ap|ib|hl|a[- ]?level)\b/gi) || []).length;
  return n;
}

export function academicsScore(p) {
  const a = p.academics || {};
  const g = gpaOn4(a);
  if (g == null) return 0;
  // Top of the curve is steep: selective admits cluster at 3.85–4.0.
  let score = curve(g, [
    [2.5, 0],
    [3.0, 26],
    [3.3, 42],
    [3.5, 55],
    [3.7, 70],
    [3.8, 79],
    [3.9, 89],
    [4.0, 97],
  ]);
  // Course rigor: up to +6 for a demanding load.
  const rc = rigorCount(a.rigor);
  score += rc >= 6 ? 6 : rc >= 4 ? 4 : rc >= 2 ? 2 : 0;
  // Class rank "3 / 120" → top-percent bonus.
  const m = String(a.classRank || '').match(/(\d+)\s*\/\s*(\d+)/);
  if (m && num(m[2]) > 0) {
    const pct = num(m[1]) / num(m[2]);
    score += pct <= 0.02 ? 4 : pct <= 0.1 ? 2 : 0;
  }
  return Math.round(clamp(score, 0, 100));
}

// ---------------------------------------------------------------- testing

// SAT → 0–100, shaped on national percentiles: 1200 ≈ 75th, 1400 ≈ 94th,
// 1500 ≈ 98th, 1550+ ≈ 99th+. Selective-admissions weight is concentrated
// at the top, so the curve is too.
export function satScore(sat) {
  return curve(num(sat), [
    [900, 0],
    [1000, 7],
    [1100, 17],
    [1200, 30],
    [1250, 38],
    [1300, 47],
    [1350, 56],
    [1400, 65],
    [1450, 75],
    [1500, 85],
    [1550, 93],
    [1600, 100],
  ]);
}

// Rough ACT → SAT concordance.
export function actToSat(act) {
  const a = Math.round(num(act));
  if (!a) return 0;
  const map = { 36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400, 30: 1370, 29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140, 22: 1110, 21: 1080, 20: 1040 };
  return map[a] || clamp(1040 + (a - 20) * 35, 700, 1590);
}

// Best aptitude-test signal as an SAT equivalent (or null).
export function satEquivalent(t = {}) {
  const sat = num(t.sat);
  const act = actToSat(t.act);
  const best = Math.max(sat, act);
  return best > 0 ? best : null;
}

// English proficiency → 0–100. Past ~7.5 IELTS / 105 TOEFL it's a gate that's
// clearly met; extra points barely matter to admissions.
export function englishScore(t = {}) {
  const parts = [];
  if (num(t.ielts)) parts.push(curve(num(t.ielts), [[5, 5], [5.5, 18], [6, 36], [6.5, 55], [7, 74], [7.5, 88], [8, 97], [9, 100]]));
  if (num(t.toefl)) parts.push(curve(num(t.toefl), [[60, 5], [70, 18], [80, 36], [90, 56], [100, 76], [105, 86], [110, 94], [115, 100]]));
  return parts.length ? Math.max(...parts) : null;
}

function apScore(t = {}) {
  const aps = (Array.isArray(t.apScores) ? t.apScores : []).filter((x) => num(x?.score) > 0);
  if (!aps.length) return null;
  const avg = aps.reduce((s, x) => s + clamp(num(x.score), 1, 7), 0) / aps.length;
  // AP is out of 5, IB out of 7 — treat >5 as IB.
  const norm = avg > 5 ? (avg / 7) * 5 : avg;
  const quality = curve(norm, [[1, 0], [2, 10], [3, 40], [4, 72], [5, 100]]);
  const volume = clamp(aps.length / 4, 0.4, 1); // 4+ exams = full credit
  return quality * volume;
}

export function testingScore(p) {
  const t = p.testing || {};
  const satEq = satEquivalent(t);
  const eng = englishScore(t);
  const ap = apScore(t);

  if (satEq == null) {
    // No aptitude test: English + AP can show readiness, but can't stand in
    // for an SAT/ACT at selective schools — capped at 45.
    const parts = [eng, ap].filter((x) => x != null);
    if (!parts.length) return 0;
    const avg = parts.reduce((s, x) => s + x, 0) / parts.length;
    return Math.round(Math.min(45, avg * 0.45));
  }

  const apt = satScore(satEq);
  // Unknown English for an international applicant is a real open question —
  // count it as middling, not as missing.
  const engPart = eng == null ? 45 : eng;
  const score = ap == null ? apt * 0.8 + engPart * 0.2 : apt * 0.72 + engPart * 0.18 + ap * 0.1;
  return Math.round(clamp(score, 0, 100));
}

// ---------------------------------------------------------------- activities

const ROLE_RULES = [
  { level: 3, key: 'role_founder', re: /\b(found|co-?found|president|captain|editor[- ]in[- ]chief|ceo|director|chair(wo)?man|head of|chief)/i },
  { level: 3, key: 'role_founder', re: /(основател|основал|создал|президент|капитан|главн\w* редактор|директор|руководител|құрылтайшы|негізін қала|президенті|капитаны|жетекші)/i },
  { level: 2, key: 'role_lead', re: /\b(lead|leader|head|manager|coordinator|organi[sz]er|vice[- ]president|vp|editor|mentor|instructor|tutor|teacher|coach)/i },
  { level: 2, key: 'role_lead', re: /(лидер|менеджер|координатор|организатор|вице|редактор|ментор|наставник|преподава|репетитор|тренер|ұйымдастыр|үйлестір|тәлімгер|жаттықтырушы)/i },
  { level: 1, key: 'role_officer', re: /\b(officer|treasurer|secretary|board|committee|intern|research(er)?|assistant|developer|author|creator|analyst)/i },
  { level: 1, key: 'role_officer', re: /(казначей|секретар|стажер|стажёр|исследовател|ассистент|разработчик|автор|аналитик|зерттеуші|әзірлеуші)/i },
];

const SCOPE_RULES = [
  { level: 4, key: 'scope_international', re: /(international|global|worldwide|countries|междунар|мировой|стран|халықаралық|әлемдік)/i },
  { level: 3, key: 'scope_national', re: /(national|nationwide|republic|country-?wide|across (the )?country|всероссий|республик|национал|по всей стране|всей стране|республикалық|ұлттық|бүкіл ел)/i },
  { level: 2, key: 'scope_regional', re: /(regional|state|city|district|municipal|oblast|областн|региональн|городск|облыс|аудандық|қалалық)/i },
  { level: 1, key: 'scope_school', re: /(school|class|campus|школ|класс|мектеп|сынып)/i },
];

// Evidence of measurable impact: a number tied to people, money, output or reach.
const IMPACT_RE = /(\$|₸|€|£|тенге|теңге)\s?\d[\d,.\s]*[kmк]?|\d[\d,.\s]*\s?(k|m|тыс|млн)?\s?(\$|₸|€|£|usd|kzt|tenge|тенге|теңге)|\b\d[\d,.]*\+?\s*(people|students|members|users|followers|subscribers|downloads|participants|kids|children|volunteers|teams|schools|countries|cities|attendees|readers|views|copies|hours|trees|families|patients|clients|customers|книг|человек|учеников|студентов|участник|пользовател|подписчик|детей|волонтер|волонтёр|школ|семей|адам|оқушы|қатысушы|пайдаланушы|бала|мектеп)/gi;
// "8-person team", "12-member crew" count as reach too.
const TEAM_RE = /\b\d+[- ](person|member|people|student)\b/gi;
const RAISED_RE = /(raised|fundrais|donat|revenue|profit|grant|sponsor|собрал|привлек|выручк|грант|спонсор|жинады)/i;
const DISTINCTION_RE = /(publish|paper|journal|patent|research|prototype|launched|app\b|startup|selected|finalist|winner|won\b|award|medal|1st|2nd|3rd|first place|second place|third place|runner-up|championship|gold|silver|bronze|top \d|accepted to|admitted to|опубликов|статья|патент|исследован|запустил|стартап|победител|место|чемпионат|призер|призёр|медал|финалист|отобран|жариялад|мақала|зерттеу|жеңімпаз|жүлде|медаль|іріктел)/i;

export function gradeActivityHeuristic(a = {}) {
  const pos = String(a.position || '');
  const org = String(a.organization || '');
  const desc = String(a.description || '');
  const all = `${pos} ${org} ${desc}`;
  const signals = [];

  if (!pos.trim() && !org.trim() && !desc.trim()) return { score: 0, tier: 4, signals: [{ key: 'empty' }], source: 'heuristic' };

  // Role — read from position first; a founder claim in the description counts too.
  let role = 0;
  let roleKey = 'role_member';
  for (const r of ROLE_RULES) {
    if (r.re.test(pos) || (r.level === 3 && r.re.test(desc))) {
      if (r.level > role) {
        role = r.level;
        roleKey = r.key;
      }
    }
  }
  signals.push({ key: roleKey });

  // Scope — the widest reach mentioned anywhere.
  let scope = 0;
  let scopeKey = null;
  for (const s of SCOPE_RULES) {
    if (s.re.test(all) && s.level > scope) {
      scope = s.level;
      scopeKey = s.key;
    }
  }
  if (scopeKey) signals.push({ key: scopeKey });

  // Quantified impact.
  const impactHits =
    (desc.match(IMPACT_RE) || []).length +
    (desc.match(TEAM_RE) || []).length +
    (RAISED_RE.test(desc) && /\d/.test(desc) ? 1 : 0);
  if (impactHits) signals.push({ key: 'quantified', n: impactHits });
  else if (desc.trim()) signals.push({ key: 'no_numbers' });

  const distinction = DISTINCTION_RE.test(all);
  if (distinction) signals.push({ key: 'distinction' });

  // Commitment: ~35 active weeks a year.
  const years = clamp(num(a.years), 0, 6);
  const hours = clamp(num(a.hours ?? a.hoursPerWeek), 0, 40); // snapshot uses hoursPerWeek
  const totalHours = Math.round(years * hours * 35);
  if (years || hours) signals.push({ key: 'hours', n: totalHours, years, hours });
  else signals.push({ key: 'no_commitment' });

  // Vague descriptions can't be credited — an admissions reader skips them too.
  const words = desc.trim().split(/\s+/).filter(Boolean).length;
  if (words < 8) signals.push({ key: 'vague' });

  // --- points (max ~100) ---
  let s = 10; // any genuine activity
  s += [0, 8, 15, 22][role]; // role
  s += [0, 3, 10, 18, 24][scope]; // reach
  s += impactHits >= 3 ? 20 : impactHits === 2 ? 16 : impactHits === 1 ? 10 : 0;
  s += distinction ? 12 : 0;
  s += totalHours >= 600 ? 12 : totalHours >= 300 ? 9 : totalHours >= 120 ? 6 : totalHours >= 40 ? 3 : 0;
  if (words < 8) s -= 10;
  else if (words >= 25) s += 3;
  // School-only reach with no numbers is capped at tier 3 no matter the title.
  if (scope <= 1 && !impactHits && !distinction) s = Math.min(s, 58);
  // Plain membership with no evidence of impact stays tier 4.
  if (role === 0 && !impactHits && !distinction && scope < 3) s = Math.min(s, 38);

  const score = Math.round(clamp(s, 3, 100));
  return { score, tier: tierFor(score), signals, source: 'heuristic' };
}

// Admissions "tiers" (the common counselor shorthand):
//   1 — rare, national/international distinction   (85+)
//   2 — significant leadership / regional impact    (65–84)
//   3 — solid commitment, some leadership           (40–64)
//   4 — participation / membership                  (<40)
export function tierFor(score) {
  if (score >= 85) return 1;
  if (score >= 65) return 2;
  if (score >= 40) return 3;
  return 4;
}

// Final grade for one activity: a FRESH AI grade wins, else the heuristic.
export function gradeActivity(a = {}) {
  const h = gradeActivityHeuristic(a);
  const ai = a.aiGrade;
  if (ai && ai.sig === activitySignature(a) && Number.isFinite(Number(ai.score))) {
    const score = Math.round(clamp(Number(ai.score), 0, 100));
    return {
      score,
      tier: tierFor(score),
      signals: h.signals,
      source: 'ai',
      reason: ai.reason || '',
      improve: ai.improve || '',
    };
  }
  return h;
}

// Weights for the top-10 activities (sum = 1). The best three carry ~3/4 —
// admissions readers judge the top of the list; the tail adds breadth.
const ACTIVITY_WEIGHTS = [0.34, 0.25, 0.18, 0.08, 0.05, 0.04, 0.02, 0.02, 0.01, 0.01];

export function activityAssessments(p) {
  const acts = Array.isArray(p.activities) ? p.activities : [];
  return acts.map((a) => ({ id: a.id, ...gradeActivity(a) }));
}

export function activitiesScore(p) {
  const graded = activityAssessments(p).filter((g) => g.score > 0);
  if (!graded.length) return 0;
  return Math.round(clamp(topWeighted(graded.map((g) => g.score), ACTIVITY_WEIGHTS), 0, 100));
}

// ---------------------------------------------------------------- honors

const LEVEL_BASE = {
  international: 100,
  national: 78,
  state: 52,
  regional: 50,
  school: 22,
};

// Olympiads/programs that admissions readers recognise instantly.
// (\b is ASCII-only in JS, so the Cyrillic names sit outside the \b group.)
const ELITE_RE = /(\b(IMO|IOI|IPhO|IChO|IBO|IOAA|IGeO|ILO|IOL|EGMO|APMO|ISEF|Regeneron|RSI|USAMO|USAJMO|USACO (Platinum|Gold)|STS|Tuymaada|Zhautykov)\b|Туймаада|Жаутыков)/i;

function placementFactor(title) {
  const s = String(title || '');
  if (/(gold|1st|first|winner|grand prize|champion|абсолют|золот|1 место|первое|победител|алтын|1-орын|бірінші|жеңімпаз)/i.test(s)) return { f: 1, key: 'place_gold' };
  if (/(silver|2nd|second|серебр|2 место|второе|күміс|2-орын|екінші)/i.test(s)) return { f: 0.86, key: 'place_silver' };
  if (/(bronze|3rd|third|бронз|3 место|третье|қола|3-орын|үшінші)/i.test(s)) return { f: 0.74, key: 'place_bronze' };
  if (/(finalist|honou?rable|mention|top \d+|semi-?final|distinction|merit|призер|призёр|финалист|похвальн|диплом|жүлдегер|мақтау)/i.test(s)) return { f: 0.62, key: 'place_finalist' };
  if (/(participa|certificate|attend|участ|сертификат|қатыс)/i.test(s)) return { f: 0.3, key: 'place_participant' };
  return { f: 0.55, key: 'place_unknown' };
}

export function gradeHonor(h = {}) {
  const title = String(h.title || '').trim();
  if (!title) return { score: 0, signals: [{ key: 'empty' }] };
  const level = String(h.level || 'school').toLowerCase();
  const base = LEVEL_BASE[level] ?? 22;
  const place = placementFactor(title);
  let score = base * place.f;
  const signals = [{ key: `level_${level}` }, { key: place.key }];
  if (ELITE_RE.test(title)) {
    score = Math.max(score, place.f >= 0.6 ? 92 : 70);
    signals.push({ key: 'elite' });
  }
  return { score: Math.round(clamp(score, 0, 100)), signals };
}

const HONOR_WEIGHTS = [0.6, 0.25, 0.1, 0.03, 0.02];

export function honorAssessments(p) {
  const honors = Array.isArray(p.honors) ? p.honors : [];
  return honors.map((h) => ({ id: h.id, ...gradeHonor(h) }));
}

export function honorsScore(p) {
  const graded = honorAssessments(p).filter((g) => g.score > 0);
  if (!graded.length) return 0;
  return Math.round(clamp(topWeighted(graded.map((g) => g.score), HONOR_WEIGHTS), 0, 100));
}

// ---------------------------------------------------------------- narrative

export function essaysScore(p) {
  // We can't grade prose deterministically, so this pillar is small and only
  // rewards what's verifiable: a draft of real length, a clear major, a spike.
  const e = p.narrative || {};
  const words = String(e.personalStatement || '').trim().split(/\s+/).filter(Boolean).length;
  let s = 0;
  if (words >= 450) s += 50;
  else if (words >= 250) s += 38;
  else if (words >= 100) s += 20;
  else if (words >= 30) s += 8;
  if (String(p.intendedMajor || '').trim()) s += 20;
  const spike = String(e.spike || '').trim();
  if (spike.split(/\s+/).length >= 4) s += 30;
  else if (spike) s += 15;
  return Math.min(100, s);
}

// ---------------------------------------------------------------- aggregate

export const PILLARS = [
  { key: 'academics', label: 'Academics', weight: 0.28, fn: academicsScore },
  { key: 'testing', label: 'Testing', weight: 0.22, fn: testingScore },
  { key: 'activities', label: 'Extracurriculars', weight: 0.28, fn: activitiesScore },
  { key: 'honors', label: 'Honors & Awards', weight: 0.14, fn: honorsScore },
  { key: 'essays', label: 'Narrative', weight: 0.08, fn: essaysScore },
];

export function profileBreakdown(p) {
  const pillars = PILLARS.map((pl) => ({
    key: pl.key,
    label: pl.label,
    weight: pl.weight,
    score: pl.fn(p || {}),
  }));
  const strength = Math.round(pillars.reduce((s, pl) => s + pl.score * pl.weight, 0));
  return { strength, pillars };
}

// Tier label for a strength number (shared by builder, review, share, PDF).
export function strengthTier(strength) {
  if (strength >= 80) return 'Exceptional';
  if (strength >= 62) return 'Strong';
  if (strength >= 42) return 'Competitive';
  return 'Developing';
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
