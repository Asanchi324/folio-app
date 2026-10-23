// AI essay coach — premium (Pro / Business-org students). Free gets a taste:
// one review per day, then the route itself says "upgrade" (server-side gate;
// the client lock is just UX). Strict no-invented-facts JSON output.
import { NextResponse } from 'next/server';
import { aiLanguageName, isLang } from '@/lib/i18n-core';
import { generate } from '@/lib/ai';
import { enforce } from '@/lib/ratelimit';
import { resolveAccess } from '@/lib/plan-server';
import { aiLimitsFor } from '@/lib/plans';
import { analyzeHook, hookPromptBlock, normalizeHookType } from '@/lib/essay-hooks';

export const runtime = 'nodejs';

const MAX_ESSAY_CHARS = 12000;

const SYSTEM = `You are Folio's essay coach — a veteran college-admissions essay editor for international students.

Hard rules:
- NEVER invent facts, achievements, names or events that are not in the student's draft. Suggestions may propose ADDING detail, but must be phrased as questions/prompts to the student ("What did the failure cost you?"), never as fabricated content.
- Diagnose honestly. No flattery. If the essay is generic, say exactly why an admissions officer would forget it in 30 seconds.
- Teach "show, don't tell": point at specific told-not-shown sentences and demonstrate the shown version USING ONLY details already present.
- Keep every suggestion concrete and actionable.
- Judge the HOOK (first 1–3 sentences) against the taxonomy built from real admitted essays. A weak opening is fixable and rarely fatal — say so honestly, then show two stronger openings built ONLY from moments, objects or lines already in the draft (often the fix is deleting sentence 1 and starting at the first concrete moment). Never invent a scene the student did not write.
- Output STRICT JSON only, matching the requested schema. No markdown.`;

function buildPrompt({ essay, promptQuestion, lang, hook }) {
  const s = hook.signals;
  const flags = [
    s.cliche && 'opens with a stock phrase readers see constantly',
    s.achievement && 'opens by announcing an achievement or title',
    s.words > 45 && `first sentence is long (${s.words} words)`,
    !s.concrete && 'no number, name or proper noun in the first two sentences',
  ].filter(Boolean);
  return `${promptQuestion ? `ESSAY PROMPT/QUESTION: ${promptQuestion}\n\n` : ''}STUDENT'S ESSAY DRAFT:
"""
${essay}
"""

${hookPromptBlock()}

OPENING CHECK (deterministic): looks like "${hook.guess}"${flags.length ? `; flags: ${flags.join('; ')}` : '; no red flags'}. Hook strength must not exceed ${hook.cap}/10.

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
  "nextDraftFocus": ["2-3 priorities for the next revision, ordered"],
  "hook": {
    "type": "one of: scene | bold_claim | dialogue | format | concept | question | setting_detail | reflective",
    "strength": 0-10,
    "diagnosis": "1-2 sentences: what the opening does to a reader in the first 10 seconds, compared with how admitted essays open",
    "alternatives": [
      { "type": "a different hook type from the list", "opening": "a new first 1-2 sentences built ONLY from details already in the draft", "why": "one sentence" }
    ]
  }
}
"hook.alternatives" must have exactly 2 entries of two different types.
Limit showDontTell to the 3 most important instances and lineEdits to 5.

LANGUAGE: write your explanations (verdict, assessment, issues, why, reason, whatChanged, nextDraftFocus) in ${aiLanguageName(lang)}. Quotes, suggested rewrites, the before/after paragraph and hook.alternatives[].opening stay in the language of the draft; hook.type values stay in English as listed.`;
}

export async function POST(request) {
  // Server-side plan gate: anonymous/free get the demo allowance, Pro gets
  // real usage. The 429 body carries upgrade:true so the client can upsell.
  const access = await resolveAccess(request);
  // Signed-in only: an anonymous endpoint can be hammered from rotating IPs,
  // a Google account per request can't.
  if (!access.uid) {
    return NextResponse.json({ error: 'Sign in to use the essay coach.', signin: true }, { status: 401 });
  }
  const limits = aiLimitsFor('essay', access.plan);
  const limited = await enforce(request, 'essay', limits, { id: access.uid || undefined });
  if (limited) {
    return NextResponse.json(
      access.plan === 'pro'
        ? limited.body
        : {
            error:
              'You have used today’s free essay reviews. Pro includes up to 15 reviews a day.',
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

  const hook = analyzeHook(essay);
  try {
    const text = await generate({
      system: SYSTEM,
      prompt: buildPrompt({ essay, promptQuestion, lang: isLang(body?.lang) ? body.lang : 'en', hook }),
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

    // Hook: known type, strength capped by the deterministic check so a stock
    // "Ever since I was little" opening can't be scored as a great hook.
    if (data.hook && typeof data.hook === 'object') {
      const strength = Number(data.hook.strength);
      data.hook = {
        type: normalizeHookType(data.hook.type) || hook.guess,
        strength: Number.isFinite(strength) ? Math.round(Math.max(0, Math.min(hook.cap, strength))) : null,
        diagnosis: String(data.hook.diagnosis || '').slice(0, 500),
        alternatives: (Array.isArray(data.hook.alternatives) ? data.hook.alternatives : [])
          .slice(0, 2)
          .map((a) => ({
            type: normalizeHookType(a?.type),
            opening: String(a?.opening || '').slice(0, 600),
            why: String(a?.why || '').slice(0, 300),
          }))
          .filter((a) => a.opening),
      };
    }
    return NextResponse.json({ review: data, plan: access.plan });
  } catch (e) {
    console.error('[essay]', e?.message);
    return NextResponse.json(
      { error: 'The essay coach is temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
