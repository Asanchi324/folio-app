// Rewrites a single portfolio entry (activity or honor) the way it should read
// on a Common App — surfacing skills, scope and measurable impact — without
// inventing facts. Returns a few variants so the student can pick a voice.
import { NextResponse } from 'next/server';
import { generate } from '@/lib/ai';
import { enforce } from '@/lib/ratelimit';

export const runtime = 'nodejs';

// Cheap-ish and called repeatedly while polishing entries — allow a decent
// daily cap but stop rapid-fire hammering within a minute.
const LIMITS = { burst: { limit: 8, windowMs: 60 * 1000 }, daily: { limit: 40 } };

const SYSTEM = `You are an expert college-application editor. You rewrite an activity/honor description so it reads powerfully on the Common App.

Hard rules:
- NEVER invent facts, numbers, awards, or outcomes that aren't supported by the input. If the student gave no metrics, you may use strong action verbs but must not fabricate figures.
- Lead with action + impact. Show leadership, initiative, skills and scope. Quantify only what the student implied.
- Common App activity descriptions are very short (~150 characters). Keep variants tight and punchy.
- It is fine to be vivid, but stay truthful and professional. No clichés like "passionate" or "hardworking".
- Output STRICT JSON only.`;

export async function POST(request) {
  const limited = await enforce(request, 'enhance', LIMITS);
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
  const { text, role, organization, kind } = body || {};
  if (!text || !String(text).trim()) {
    return NextResponse.json({ error: 'Nothing to enhance' }, { status: 400 });
  }

  const prompt = `Entry type: ${kind || 'activity'}
Role/title: ${role || '(none)'}
Organization: ${organization || '(none)'}
Student's draft: "${text}"

Return JSON with EXACTLY this shape:
{
  "variants": [
    { "label": "Impact-led", "text": "rewritten ~150 char description" },
    { "label": "Leadership-led", "text": "rewritten ~150 char description" },
    { "label": "Concise", "text": "rewritten ~150 char description" }
  ],
  "tip": "one sentence on what would make this entry even stronger (e.g. add a metric)"
}`;

  try {
    const out = await generate({ system: SYSTEM, prompt, json: true });
    let data;
    try {
      data = JSON.parse(out);
    } catch {
      const m = out.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : null;
    }
    if (!data) throw new Error('parse');
    return NextResponse.json(data);
  } catch (e) {
    console.error('[enhance]', e?.message);
    return NextResponse.json(
      { error: 'Could not enhance right now. Please try again.' },
      { status: 503 }
    );
  }
}
