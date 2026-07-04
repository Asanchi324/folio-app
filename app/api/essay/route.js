// AI essay coach — premium (Pro / Business-org students). Free gets a taste:
// one review per day, then the route itself says "upgrade" (server-side gate;
// the client lock is just UX). Strict no-invented-facts JSON output.
import { NextResponse } from 'next/server';
import { generate } from '@/lib/ai';
import { enforce } from '@/lib/ratelimit';
import { resolveAccess } from '@/lib/plan-server';
import { aiLimitsFor } from '@/lib/plans';

export const runtime = 'nodejs';

const MAX_ESSAY_CHARS = 12000;

const SYSTEM = `You are Folio's essay coach — a veteran college-admissions essay editor for international students.

Hard rules:
- NEVER invent facts, achievements, names or events that are not in the student's draft. Suggestions may propose ADDING detail, but must be phrased as questions/prompts to the student ("What did the failure cost you?"), never as fabricated content.
- Diagnose honestly. No flattery. If the essay is generic, say exactly why an admissions officer would forget it in 30 seconds.
- Teach "show, don't tell": point at specific told-not-shown sentences and demonstrate the shown version USING ONLY details already present.
- Keep every suggestion concrete and actionable.
- Output STRICT JSON only, matching the requested schema. No markdown.`;

function buildPrompt({ essay, promptQuestion }) {
  return `${promptQuestion ? `ESSAY PROMPT/QUESTION: ${promptQuestion}\n\n` : ''}STUDENT'S ESSAY DRAFT:
"""
${essay}
"""

Return JSON with EXACTLY this shape:
{
  "verdict": "one honest sentence: where this draft stands",
  "score": { "structure": 0-10, "voice": 0-10, "specificity": 0-10, "impact": 0-10 },
  "structure": {
    "assessment": "2-3 sentences on the arc: hook, development, turn, resolution",
    "issues": ["specific structural problems, if any"]
  },
  "showDontTell": [
    { "quote": "exact sentence from the draft that TELLS", "why": "why it reads as telling", "showInstead": "a rewritten version using ONLY details already in the draft, or a question prompting the student for the missing detail" }
  ],
  "lineEdits": [
    { "quote": "exact phrase/sentence", "suggestion": "tighter or more vivid rewrite", "reason": "one short clause" }
  ],
  "beforeAfter": {
    "paragraph": "the weakest paragraph, quoted from the draft",
    "rewrite": "the same paragraph rewritten to show craft — same facts only",
    "whatChanged": "1-2 sentences explaining the technique used"
  },
  "nextDraftFocus": ["2-3 priorities for the next revision, ordered"]
}
Limit showDontTell to the 3 most important instances and lineEdits to 5.`;
}

export async function POST(request) {
  // Server-side plan gate: anonymous/free get the demo allowance, Pro gets
  // real usage. The 429 body carries upgrade:true so the client can upsell.
  const access = await resolveAccess(request);
  const limits = aiLimitsFor('essay', access.plan);
  const limited = await enforce(request, 'essay', limits, { id: access.uid || undefined });
  if (limited) {
    return NextResponse.json(
      access.plan === 'pro'
        ? limited.body
        : {
            error:
              'That’s your free essay review for today. Pro includes up to 12 deep reviews a day.',
            upgrade: true,
          },
      { status: limited.status, headers: { 'Retry-After': String(limited.retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const essay = String(body?.essay || '').trim();
  const promptQuestion = String(body?.promptQuestion || '').trim().slice(0, 400);
  if (essay.length < 120) {
    return NextResponse.json(
      { error: 'Paste at least a rough draft (a few paragraphs) — 120+ characters.' },
      { status: 400 }
    );
  }
  if (essay.length > MAX_ESSAY_CHARS) {
    return NextResponse.json(
      { error: `That's longer than any application essay — keep it under ${MAX_ESSAY_CHARS} characters.` },
      { status: 400 }
    );
  }

  try {
    const text = await generate({
      system: SYSTEM,
      prompt: buildPrompt({ essay, promptQuestion }),
      json: true,
      cache: false, // essay drafts are personal — don't cross-serve
    });
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : null;
    }
    if (!data) throw new Error('Could not parse AI response');
    return NextResponse.json({ review: data, plan: access.plan });
  } catch (e) {
    console.error('[essay]', e?.message);
    return NextResponse.json(
      { error: 'The essay coach is temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
