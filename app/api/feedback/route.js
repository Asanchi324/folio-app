// AI feedback on the whole portfolio. Returns structured JSON: an honest
// assessment plus concrete, personalised recommendations (raise SAT, specific
// olympiads to enter, leadership gaps, etc.). The client renders it as cards.
import { NextResponse } from 'next/server';
import { generate } from '@/lib/ai';
import { enforce } from '@/lib/ratelimit';
import { profileBreakdown, gradeActivityHeuristic, gradeHonor } from '@/lib/profile';
import { selectCompetitions } from '@/lib/competitions';
import { reviewSnapshot } from '@/lib/review-input';
import { resolveAccess } from '@/lib/plan-server';
import { aiLimitsFor } from '@/lib/plans';
import { aiLanguageName, isLang } from '@/lib/i18n-core';
import { admitsPromptBlock } from '@/lib/admits';

export const runtime = 'nodejs';

const SYSTEM = `You are Folio's admissions strategist — a sharp, experienced college counselor for international students applying to top global universities.

Rules:
- Be honest and specific. No flattery, no vague pep talk. If something is weak, say so plainly and explain why it matters to admissions officers.
- Every recommendation must be ACTIONABLE and CONCRETE: name specific exams to retake (with target scores), specific olympiads/competitions/programs to enter, specific leadership moves. Avoid generic advice like "get more involved".
- When recommending competitions, prefer ones from the provided catalog and reference them by name.
- For Extracurriculars and Honors, give the student real choice: 2–3 concrete, varied ideas (different competitions, projects or roles) inside that area's items list, not a single suggestion.
- Calibrate to reality: a strong profile is still a reach at single-digit-acceptance schools.
- Calibrate against the REFERENCE ADMITS in the prompt: they are real, verified files. Compare the LEVEL of the student's strongest honor and activity with theirs, not the count. Refer to them only by description ("a student from Almaty admitted to Harvard with SAT 1510"), never by name, never invent details about them, and never imply that matching one record guarantees an admission — single files are noisy, so reason from the pattern across them.
- Paid summer schools and pay-to-attend pre-college programs show interest, not selection: never grade them above Tier 3 and never recommend them as a strategy. Recommend free, selective programs and competitions instead.
- Above roughly SAT 1500, more test points barely move admissions at top schools; do not make a retake the top priority for such a student unless the score is below the target school's 25th percentile.
- Grade every extracurricular on the admissions tier rubric. Judge the EVIDENCE in the text, not the title: a "President" with no described outcome is not Tier 1. Rubric (score 0-100):
  Tier 1 (85-100): rare distinction — national/international recognition, founded something with large measurable reach, published research, elite selective program.
  Tier 2 (65-84): significant leadership or impact beyond school — regional/national results, sustained initiative with concrete numbers.
  Tier 3 (40-64): solid commitment and some leadership inside school/community; limited evidence of impact.
  Tier 4 (0-39): participation or membership; vague, no outcomes, or minimal time.
  A vague one-line description can never exceed 40, whatever the role.
- The portfolio in the prompt is the COMPLETE and CURRENT profile, and your only source of truth. If an activity, award, score or essay is not listed there, it does not exist — never mention, assume or "remember" one. Do not carry over anything from any earlier review.
- Judge only what is present: an empty or missing section means that section is EMPTY, and the honest advice is to build it — not to comment on content you imagine was there.
- Group recommendations by area: emit AT MOST ONE block per area (Testing, Academics, Extracurriculars, Honors, Narrative). NEVER output two blocks for the same area — consolidate every point for that area into its "items" list. Skip areas that genuinely need no action.
- Output STRICT JSON only, matching the requested schema. No markdown, no commentary outside JSON.`;

function buildPrompt(portfolio, breakdown, lang) {
  // Only a relevant slice of the catalog goes into the prompt — keeps the
  // context small and on-topic even as the full catalog grows.
  const catalog = selectCompetitions(portfolio, 16)
    .map(
      (c) => `- ${c.name} [${c.category}, ${c.level}, difficulty ${c.difficulty}/5]: ${c.blurb}`
    )
    .join('\n');

  // Explicit counts + "nothing else exists" framing. Without them a model will
  // happily reason about a 4th activity when only 3 are listed.
  const inventory = [
    `Extracurriculars listed: ${portfolio.activities.length}`,
    `Honors listed: ${portfolio.honors.length}`,
    `AP/IB scores listed: ${portfolio.testing.apScores?.length || 0}`,
  ].join(' | ');

  return `STUDENT PORTFOLIO — CURRENT STATE, as of this request (JSON).
This is the entire portfolio. Anything not listed here does not exist: the
student has no other activities, awards or scores than the ones below, and any
item you may have seen in an earlier review has been removed by the student.
Review THIS profile only.

${JSON.stringify(portfolio, null, 2)}

INVENTORY (counts are exact): ${inventory}

RUBRIC PRE-SCORES (deterministic keyword rubric — use as an anchor; adjust when the text clearly supports it):
${portfolio.activities.map((a, i) => `  activity #${i}: ${gradeActivityHeuristic(a).score}/100`).join('\n') || '  (no activities)'}
${portfolio.honors.map((h, i) => `  honor #${i}: ${gradeHonor(h).score}/100`).join('\n') || '  (no honors)'}

COMPUTED PROFILE STRENGTH: ${breakdown.strength}/100
PILLAR SCORES: ${breakdown.pillars.map((p) => `${p.label} ${p.score}/100`).join(', ')}

${admitsPromptBlock(portfolio)}

COMPETITION CATALOG you may recommend from:
${catalog}

Group ALL advice into ONE block per area — never repeat an area, max 5 blocks total.
Return JSON with EXACTLY this shape:
{
  "headline": "one honest sentence summarizing where this applicant stands",
  "benchmarkComparison": "1-2 sentences: how this profile compares with the reference admits most similar to it — what they had at which level that this student does not yet (or does)",
  "overallTier": "developing | competitive | strong | exceptional",
  "strengths": ["2-4 concrete strengths"],
  "gaps": ["2-4 concrete weaknesses, each explaining the admissions impact"],
  "recommendations": [
    {
      "area": "Testing | Academics | Extracurriculars | Honors | Narrative",
      "priority": "high | medium | low",
      "overview": "one sentence on where this area stands and why it's this priority",
      "items": [
        {
          "action": "one concrete next step",
          "detail": "why it matters + how to do it, 1-2 sentences",
          "competitions": ["exact names from the catalog, if relevant, else empty array"]
        }
      ]
    }
  ],
  "nextSemester": ["3-5 specific things to do in the next 3-6 months, ordered by impact"],
  "activityGrades": [
    { "index": 0, "score": 0-100, "reason": "one sentence: what this activity proves (or fails to prove) to a reader", "improve": "one concrete way to move it up a tier" }
  ]
}
"activityGrades" must contain exactly one entry per listed activity, in order (index 0 = first activity). Empty array if there are no activities.

LANGUAGE: write every human-readable string value in ${aiLanguageName(lang)}. Keep JSON keys, the "area" and "priority" and "overallTier" values in English exactly as specified, and keep competition names as in the catalog.`;
}

export async function POST(request) {
  // The full review stays free (it IS the funnel); Pro lifts the caps.
  const access = await resolveAccess(request);
  const limited = await enforce(request, 'feedback', aiLimitsFor('feedback', access.plan), {
    id: access.uid || undefined,
  });
  if (limited) {
    return NextResponse.json(limited.body, {
      status: limited.status,
      headers: { 'Retry-After': String(limited.retryAfter) },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const raw = body?.portfolio;
  if (!raw) {
    return NextResponse.json({ error: 'No portfolio provided' }, { status: 400 });
  }

  // Strip to the current-state slice before anything else touches it. Old
  // clients still POST the whole portfolio (previous review included) — this is
  // what guarantees none of it reaches the model.
  const portfolio = reviewSnapshot(raw);
  const breakdown = profileBreakdown(portfolio);
  const lang = isLang(body?.lang) ? body.lang : 'en';

  const parse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      // Best-effort: strip code fences if the model added them.
      const m = text.match(/\{[\s\S]*\}/);
      try {
        return m ? JSON.parse(m[0]) : null;
      } catch {
        return null;
      }
    }
  };

  try {
    const prompt = buildPrompt(portfolio, breakdown, lang);
    // An explicit re-run ("refresh my review") must actually re-generate,
    // not replay the cached answer for the same profile.
    let data = parse(await generate({ system: SYSTEM, prompt, json: true, cache: !body?.fresh }));
    // Long JSON occasionally comes back malformed; one uncached retry.
    if (!data) data = parse(await generate({ system: SYSTEM, prompt, json: true, cache: false }));
    if (!data) throw new Error('Could not parse AI response');

    // Normalise activity grades: one per activity, clamped to within ±25 of the
    // rubric anchor so a single over-generous model run can't turn a club
    // membership into a Tier 1 activity (or sink a real one).
    const raw_ = Array.isArray(data.activityGrades) ? data.activityGrades : [];
    data.activityGrades = portfolio.activities.map((a, i) => {
      const g = raw_.find((x) => Number(x?.index) === i) || raw_[i] || null;
      const anchor = gradeActivityHeuristic(a).score;
      const score = Number(g?.score);
      if (!g || !Number.isFinite(score)) return null;
      return {
        index: i,
        score: Math.round(Math.max(anchor - 25, Math.min(anchor + 25, Math.max(0, Math.min(100, score))))),
        reason: String(g.reason || '').slice(0, 300),
        improve: String(g.improve || '').slice(0, 300),
      };
    });
    return NextResponse.json({ feedback: data, breakdown });
  } catch (e) {
    console.error('[feedback]', e?.message);
    return NextResponse.json(
      { error: 'AI feedback is temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
