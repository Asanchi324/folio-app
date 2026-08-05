// AI feedback on the whole portfolio. Returns structured JSON: an honest
// assessment plus concrete, personalised recommendations (raise SAT, specific
// olympiads to enter, leadership gaps, etc.). The client renders it as cards.
import { NextResponse } from 'next/server';
import { generate } from '@/lib/ai';
import { enforce } from '@/lib/ratelimit';
import { profileBreakdown } from '@/lib/profile';
import { selectCompetitions } from '@/lib/competitions';
import { reviewSnapshot } from '@/lib/review-input';
import { resolveAccess } from '@/lib/plan-server';
import { aiLimitsFor } from '@/lib/plans';

export const runtime = 'nodejs';

const SYSTEM = `You are Folio's admissions strategist — a sharp, experienced college counselor for international students applying to top global universities.

Rules:
- Be honest and specific. No flattery, no vague pep talk. If something is weak, say so plainly and explain why it matters to admissions officers.
- Every recommendation must be ACTIONABLE and CONCRETE: name specific exams to retake (with target scores), specific olympiads/competitions/programs to enter, specific leadership moves. Avoid generic advice like "get more involved".
- When recommending competitions, prefer ones from the provided catalog and reference them by name.
- For Extracurriculars and Honors, give the student real choice: 2–3 concrete, varied ideas (different competitions, projects or roles) inside that area's items list, not a single suggestion.
- Calibrate to reality: a strong profile is still a reach at single-digit-acceptance schools.
- The portfolio in the prompt is the COMPLETE and CURRENT profile, and your only source of truth. If an activity, award, score or essay is not listed there, it does not exist — never mention, assume or "remember" one. Do not carry over anything from any earlier review.
- Judge only what is present: an empty or missing section means that section is EMPTY, and the honest advice is to build it — not to comment on content you imagine was there.
- Group recommendations by area: emit AT MOST ONE block per area (Testing, Academics, Extracurriculars, Honors, Narrative). NEVER output two blocks for the same area — consolidate every point for that area into its "items" list. Skip areas that genuinely need no action.
- Output STRICT JSON only, matching the requested schema. No markdown, no commentary outside JSON.`;

function buildPrompt(portfolio, breakdown) {
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

COMPUTED PROFILE STRENGTH: ${breakdown.strength}/100
PILLAR SCORES: ${breakdown.pillars.map((p) => `${p.label} ${p.score}/100`).join(', ')}

COMPETITION CATALOG you may recommend from:
${catalog}

Group ALL advice into ONE block per area — never repeat an area, max 5 blocks total.
Return JSON with EXACTLY this shape:
{
  "headline": "one honest sentence summarizing where this applicant stands",
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
  "nextSemester": ["3-5 specific things to do in the next 3-6 months, ordered by impact"]
}`;
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

  try {
    const text = await generate({
      system: SYSTEM,
      prompt: buildPrompt(portfolio, breakdown),
      json: true,
      // An explicit re-run ("refresh my review") must actually re-generate,
      // not replay the cached answer for the same profile.
      cache: !body?.fresh,
    });
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Best-effort: strip code fences if the model added them.
      const m = text.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : null;
    }
    if (!data) throw new Error('Could not parse AI response');
    return NextResponse.json({ feedback: data, breakdown });
  } catch (e) {
    console.error('[feedback]', e?.message);
    return NextResponse.json(
      { error: 'AI feedback is temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
