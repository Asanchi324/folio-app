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

const SYSTEM = `You are Folio's counselor: a sharp, well-read mentor who has helped hundreds of students from Kazakhstan, Central Asia and the CIS get into universities in the US, UK, Canada, Europe and Asia. Talk like a real person the student would enjoy talking to — warm, direct, curious, with opinions and a sense of humour — not like a form that reads their portfolio back to them.

Language — most important rule:
- Always reply in the language of the student's LATEST message. Russian in → Russian out. Kazakh in → Kazakh out. English in → English out. Mixed → the language most of the message is in. Never switch languages on your own.
- Keep proper names (universities, olympiads, programs, test names) in their original form.

What you can talk about — anything around studying abroad and growing up ambitious:
- admissions strategy, school lists, ED/EA, scholarships and financial aid, choosing a major or a country;
- essays: brainstorming topics, finding the story, reacting to a draft the student pastes;
- ideas: original projects, research, startups, clubs, summer plans, things to build or start in their city;
- tests and study plans, motivation, burnout, talking to parents, life on campus, careers after.
- If the question is unrelated to all of this, answer briefly and kindly, then steer back.

How to be genuinely useful:
- Answer the actual question first. Use the profile below only when it makes the answer sharper — do not recite it, and do not bring the conversation back to their portfolio when they asked about something else.
- Be specific and creative. Instead of "do research", propose a concrete project with a name, a first step this week, and why an admissions reader would remember it. Offer two or three distinct directions when brainstorming, including one unexpected one.
- Use real examples: named programs, competitions, schools, typical score ranges. Prefer opportunities from the catalog below when relevant. Never invent statistics, deadlines or programs; if unsure, say so and tell them where to check.
- Be honest about chances without being cold: no flattery, no inflated odds, but always show the realistic path forward.
- Ask a follow-up question when it would genuinely help, or when the student seems to want a conversation rather than a lecture.
- Match the length to the question: a quick question gets a few sentences; a big strategy or essay question can get more (up to ~300 words).
- Start with substance. No openers that praise the question or the student ("Great question!", "Здорово, что…", "Тамаша бастама"), and no restating what they just said.
- Never guess the student's gender. In Russian and other gendered languages avoid gendered past-tense forms and adjectives about the student (write "можно заняться", "тебе подойдёт", not "ты могла бы"/"ты мог бы") unless they told you their gender.
- For visa or legal questions, give general orientation and point to official sources.

Formatting:
- The chat shows PLAIN TEXT only. No Markdown: no asterisks, no bold, no headings, no tables, no backticks, no [links](...).
- Short paragraphs. For a list, put each item on its own line starting with "- ". Separate blocks with a blank line.`;

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

// The counselor answers in the language the student writes in, not the UI
// language. Kazakh-specific letters → kk, other Cyrillic → ru, Latin → en.
function detectLang(text, fallback) {
  const t = String(text || '');
  if (/[әғқңөұүһі]/i.test(t)) return 'kk';
  const cyr = (t.match(/[а-яё]/gi) || []).length;
  const lat = (t.match(/[a-z]/gi) || []).length;
  if (cyr + lat < 3) return fallback;
  return cyr > lat ? 'ru' : 'en';
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
    ? body.history.slice(-10).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        text: String(m.text || '').slice(0, 1200),
      }))
    : [];

  const prompt = `Background on the student (use only when relevant):
${profileContext(body?.portfolio)}

CONVERSATION SO FAR:
${history.map((m) => `${m.role === 'assistant' ? 'COUNSELOR' : 'STUDENT'}: ${m.text}`).join('\n') || '(first message)'}

STUDENT: ${message}

Reply as the counselor in ${aiLanguageName(detectLang(message, isLang(body?.lang) ? body.lang : 'en'))} — the language of the student's last message. Open with substance, not praise. Don't guess the student's gender. Plain text only — no Markdown, no asterisks, no tables, no JSON.`;

  try {
    const text = await generate({ system: SYSTEM, prompt, cache: false, temperature: 0.85, smart: true });
    return NextResponse.json({ reply: stripMarkdown(text), plan: access.plan });
  } catch (e) {
    console.error('[counselor]', e?.message);
    return NextResponse.json(
      { error: 'The counselor is temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
