// Rewrites a single portfolio entry (activity or honor) the way it should read
// on a Common App — surfacing skills, scope and measurable impact — without
// inventing facts. Returns a few variants so the student can pick a voice.
import { NextResponse } from 'next/server';
import { generate } from '@/lib/ai';
import { enforce } from '@/lib/ratelimit';
import { resolveAccess } from '@/lib/plan-server';
import { aiLimitsFor } from '@/lib/plans';
import { aiLanguageName, isLang } from '@/lib/i18n-core';

export const runtime = 'nodejs';

const SYSTEM = `You are an expert college-application editor. You rewrite an activity/honor description so it reads powerfully on the Common App.

Hard rules:
- NEVER invent facts, numbers, awards, or outcomes that aren't supported by the input. If the student gave no metrics, you may use strong action verbs but must not fabricate figures.
- Lead with action + impact. Show leadership, initiative, skills and scope. Quantify only what the student implied.
- Common App activity descriptions are very short (~150 characters). Keep variants tight and punchy.
- It is fine to be vivid, but stay truthful and professional. No clichés like "passionate" or "hardworking".
- Output STRICT JSON only.`;

export async function POST(request) {
  // Polishing stays free for everyone; Pro just gets roomier limits. Signed-in
  // users are keyed by uid so their allowance follows the account, not the IP.
  const access = await resolveAccess(request);
  const limited = await enforce(request, 'enhance', aiLimitsFor('enhance', access.plan), {
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
  const text = String(body?.text || '').trim().slice(0, 1500);
  const role = String(body?.role || '').slice(0, 150);
  const organization = String(body?.organization || '').slice(0, 150);
  const kind = body?.kind === 'honor' ? 'honor' : 'activity';
  const lang = isLang(body?.lang) ? body.lang : 'en';
  if (!text) {
    return NextResponse.json({ error: 'Nothing to enhance' }, { status: 400 });
  }

  const prompt = `Entry type: ${kind || 'activity'}
Role/title: ${role || '(none)'}
Organization: ${organization || '(none)'}
Student's draft: "${text.replace(/"/g, "'")}"

Return JSON with EXACTLY this shape:
{
  "variants": [
    { "label": "Impact-led", "text": "rewritten ~150 char description" },
    { "label": "Leadership-led", "text": "rewritten ~150 char description" },
    { "label": "Concise", "text": "rewritten ~150 char description" }
  ],
  "tip": "one sentence on what would make this entry even stronger (e.g. add a metric)"
}

The variants stay in ENGLISH (applications are submitted in English). Write the "tip" in ${aiLanguageName(lang)}.`;

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
