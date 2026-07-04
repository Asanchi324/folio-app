// AI counselor — the conversational admissions strategist (flagship Pro
// feature). Sees a compact summary of the student's portfolio + chances +
// relevant opportunities, answers "where can I actually get in", "what should
// I do this summer", etc. Free plan gets 3 messages/day (server-enforced).
import { NextResponse } from 'next/server';
import { generate } from '@/lib/ai';
import { enforce } from '@/lib/ratelimit';
import { resolveAccess } from '@/lib/plan-server';
import { aiLimitsFor } from '@/lib/plans';
import { profileBreakdown } from '@/lib/profile';
import { selectCompetitions } from '@/lib/competitions';

export const runtime = 'nodejs';

const SYSTEM = `You are Folio's AI counselor — an honest, experienced college admissions strategist for international students (many from Central Asia / CIS applying to the US, UK, Canada, Europe).

Rules:
- No glaze. Never inflate chances or flatter. If a plan is unrealistic, say so and give the realistic alternative.
- Be specific: name schools, score targets, competitions (prefer ones from the provided catalog), concrete summer plans. Generic advice ("work hard, be yourself") is forbidden.
- Ground every claim in the student's actual profile data provided below. If data is missing (no GPA, no tests), say what to add before you can advise precisely.
- Think like a strategist: ED/EA/RD tradeoffs, school-list balance (reach/target/safety), spike-building over resume-padding.
- Keep answers tight: 120-250 words, formatted as short paragraphs or a compact list. End with ONE clear next action when natural.
- You are not a lawyer/visa officer; for visa/financial-aid legalities, recommend checking official sources.`;

// Compact profile summary — we never ship the whole portfolio JSON each turn.
function profileContext(portfolio) {
  if (!portfolio) return 'No portfolio data shared.';
  const b = profileBreakdown(portfolio);
  const t = portfolio.testing || {};
  const a = portfolio.academics || {};
  const acts = (portfolio.activities || [])
    .slice(0, 10)
    .map((x) => `${x.position || 'Member'} @ ${x.organization || '?'}`)
    .join('; ');
  const honors = (portfolio.honors || [])
    .slice(0, 5)
    .map((h) => `${h.title} (${h.level})`)
    .join('; ');
  const comps = selectCompetitions(portfolio, 8)
    .map((c) => `${c.name} [${c.category}]`)
    .join('; ');
  return `STUDENT PROFILE SUMMARY
Name: ${portfolio.fullName || '?'} | Grade: ${portfolio.gradeLevel || '?'} | From: ${portfolio.country || '?'} | Targets: ${(portfolio.targetCountries || []).join(', ') || '?'} | Major: ${portfolio.intendedMajor || 'undecided'}
GPA: ${a.gpa || 'none'}/${a.gpaScale || 4} | SAT: ${t.sat || '—'} | ACT: ${t.act || '—'} | IELTS: ${t.ielts || '—'} | TOEFL: ${t.toefl || '—'}
Strength: ${b.strength}/100 (${b.pillars.map((p) => `${p.label} ${p.score}`).join(', ')})
Activities: ${acts || 'none'}
Honors: ${honors || 'none'}
Spike: ${portfolio.narrative?.spike || '—'}
Relevant catalog opportunities: ${comps}`;
}

export async function POST(request) {
  const access = await resolveAccess(request);
  const limits = aiLimitsFor('counselor', access.plan);
  const limited = await enforce(request, 'counselor', limits, { id: access.uid || undefined });
  if (limited) {
    return NextResponse.json(
      access.plan === 'pro'
        ? limited.body
        : {
            error:
              'You’ve used your 3 free counselor messages for today. Pro unlocks the full conversation.',
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
  const message = String(body?.message || '').trim().slice(0, 2000);
  if (!message) {
    return NextResponse.json({ error: 'Ask something first.' }, { status: 400 });
  }
  // Last few turns only — the profile summary carries the real context.
  const history = Array.isArray(body?.history)
    ? body.history.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        text: String(m.text || '').slice(0, 1200),
      }))
    : [];

  const prompt = `${profileContext(body?.portfolio)}

CONVERSATION SO FAR:
${history.map((m) => `${m.role === 'assistant' ? 'COUNSELOR' : 'STUDENT'}: ${m.text}`).join('\n') || '(first message)'}

STUDENT: ${message}

Reply as the counselor (plain text, no JSON).`;

  try {
    const text = await generate({ system: SYSTEM, prompt, cache: false });
    return NextResponse.json({ reply: text.trim(), plan: access.plan });
  } catch (e) {
    console.error('[counselor]', e?.message);
    return NextResponse.json(
      { error: 'The counselor is temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
