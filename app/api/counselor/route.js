// AI counselor — the conversational admissions strategist (flagship Pro
// feature). Sees a compact summary of the student's portfolio + chances +
// relevant opportunities, answers "where can I actually get in", "what should
// I do this summer", etc. Free plan gets 3 messages/day (server-enforced).
import { NextResponse } from 'next/server';
import { aiLanguageName, isLang } from '@/lib/i18n-core';
import { generate } from '@/lib/ai';
import { reviewSnapshot } from '@/lib/review-input';
import { enforce } from '@/lib/ratelimit';
import { resolveAccess } from '@/lib/plan-server';
import { aiLimitsFor } from '@/lib/plans';
import { profileBreakdown } from '@/lib/profile';
import { selectCompetitions } from '@/lib/competitions';

export const runtime = 'nodejs';

const SYSTEM = `You are Folio's AI counselor — an honest, experienced college admissions strategist for international students (many from Central Asia / CIS applying to the US, UK, Canada, Europe).

How to think (before you answer):
- Reason like a strategist, not a cheerleader. Quickly weigh the student's real numbers against the target schools' typical admitted ranges (SAT/GPA middle-50), and factor in ED/EA/RD tradeoffs, school-list balance (reach/target/safety), and spike-building over resume-padding.
- Find the single highest-leverage move for THIS student and lead with it. Don't list ten mediocre ideas — give the one or two that actually change their odds.
- If a fact that would change your answer is missing (no GPA, no test scores, no target list), ask ONE sharp clarifying question instead of guessing or hedging.
- No glaze. Never inflate chances or flatter. If a plan is unrealistic, say so plainly and give the realistic alternative.

What to say:
- Be concrete: name specific schools, score targets, and competitions (prefer ones from the provided catalog), with real summer/semester plans. Generic advice ("work hard, be yourself") is forbidden.
- Use the student's actual numbers in your reasoning (e.g. "your 1380 is below Cornell's ~1500 median"). Ground every claim in the profile data below.
- You are not a lawyer/visa officer; for visa/financial-aid legalities, point them to official sources.

Formatting — READ CAREFULLY:
- This chat renders PLAIN TEXT ONLY. It does NOT support Markdown, so any markup shows up as literal broken symbols to the student.
- NEVER use asterisks for emphasis (no **bold**, no *italics*), NEVER use tables, NEVER use headings (#), backticks, or [markdown](links).
- Write in plain sentences and short paragraphs. If you need a list, put each item on its own line starting with "- " (a dash and a space). Separate sections with a blank line.
- Keep it tight: 100-220 words. End with ONE clear next action when it fits naturally.`;

// The chat bubble renders plain text (whiteSpace: pre-wrap, no Markdown parser),
// so any Markdown the model emits shows up as literal broken symbols. The system
// prompt forbids it, but models slip — this is the belt-and-suspenders that
// guarantees clean output regardless.
function stripMarkdown(input) {
  const lines = String(input || '').split('\n');
  const out = lines
    // Drop table separator rows like |---|:--:|
    .filter((l) => !/^\s*\|?[\s:|-]*\|[\s:|-]*\|?\s*$/.test(l) || !l.includes('|'))
    .map((l) => {
      let s = l;
      // Table row → cells joined with an em dash.
      if (/^\s*\|.*\|\s*$/.test(s)) {
        s = s
          .replace(/^\s*\|/, '')
          .replace(/\|\s*$/, '')
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean)
          .join(' — ');
      }
      // Headings and blockquotes → plain lines.
      s = s.replace(/^\s{0,3}#{1,6}\s+/, '').replace(/^\s{0,3}>\s?/, '');
      // Bullet markers (* or +) → a dash, so lists stay readable.
      s = s.replace(/^(\s*)[*+]\s+/, '$1- ');
      return s;
    })
    .join('\n');

  return out
    // Links [text](url) → text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    // Bold/italic markers, keeping the inner text. The italic pass anchors the
    // opening marker to a word boundary (start or whitespace) so it strips
    // emphasis like " *word* " without eating list bullets ("* item").
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|\s)([*_])(?=\S)([^*_\n]+?)(?<=\S)\2(?=\s|[.,;:!?)]|$)/g, '$1$3')
    // Stray leftover bold markers and inline code backticks.
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

// Compact profile summary — we never ship the whole portfolio JSON each turn.
function profileContext(raw) {
  if (!raw || typeof raw !== 'object') return 'No portfolio data shared.';
  // Length-capped current-state slice (same one the review uses) + the name.
  const portfolio = { ...reviewSnapshot(raw), fullName: String(raw.fullName || '').slice(0, 80) };
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
              'You have used your 3 free counselor messages for today. Pro unlocks the full conversation.',
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

Reply as the counselor in ${aiLanguageName(isLang(body?.lang) ? body.lang : 'en')}. Plain text only — no Markdown, no asterisks, no tables, no JSON.`;

  try {
    const text = await generate({ system: SYSTEM, prompt, cache: false });
    return NextResponse.json({ reply: stripMarkdown(text), plan: access.plan });
  } catch (e) {
    console.error('[counselor]', e?.message);
    return NextResponse.json(
      { error: 'The counselor is temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
