// AI feedback on the whole portfolio. Returns structured JSON: an honest
// assessment plus concrete, personalised recommendations (raise SAT, specific
// olympiads to enter, leadership gaps, etc.). The client renders it as cards.
import { NextResponse } from 'next/server';
import { generate } from '@/lib/ai';
import { enforce } from '@/lib/ratelimit';
import { profileBreakdown } from '@/lib/profile';
import { selectCompetitions } from '@/lib/competitions';

export const runtime = 'nodejs';

// A full-portfolio review is a heavier call than a single-entry polish, so the
// caps are tighter.
const LIMITS = { burst: { limit: 4, windowMs: 60 * 1000 }, daily: { limit: 20 } };

const SYSTEM = `You are Folio's admissions strategist — a sharp, experienced college counselor for international students applying to top global universities.

Rules:
- Be honest and specific. No flattery, no vague pep talk. If something is weak, say so plainly and explain why it matters to admissions officers.
- Every recommendation must be ACTIONABLE and CONCRETE: name specific exams to retake (with target scores), specific olympiads/competitions/programs to enter, specific leadership moves. Avoid generic advice like "get more involved".
- When recommending competitions, prefer ones from the provided catalog and reference them by name.
- For Extracurriculars and Honors, give the student real choice: 2–3 concrete, varied ideas (different competitions, projects or roles) inside that area's items list, not a single suggestion.
- Calibrate to reality: a strong profile is still a reach at single-digit-acceptance schools.
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

  return `STUDENT PORTFOLIO (JSON):
${JSON.stringify(portfolio, null, 2)}

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
  const limited = await enforce(request, 'feedback', LIMITS);
  if (limited) {
    return NextResponse.json(limited.body, {
      status: limited.status,
      headers: { 'Retry-After': String(limited.retryAfter) },
    });
  }

  let portfolio;
  try {
    portfolio = (await request.json())?.portfolio;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!portfolio) {
    return NextResponse.json({ error: 'No portfolio provided' }, { status: 400 });
  }

  const breakdown = profileBreakdown(portfolio);

  try {
    const text = await generate({
      system: SYSTEM,
      prompt: buildPrompt(portfolio, breakdown),
      json: true,
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
