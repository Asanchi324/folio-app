import Link from 'next/link';
import Reveal from '@/components/Reveal';
import PricingCards from '@/components/Pricing';
import { UNIVERSITIES } from '@/lib/universities';
import { COMPETITIONS } from '@/lib/competitions';

// Landing — server component, fully static. Two audiences, one page:
// students (primary funnel → /start) and schools/counselors (→ /start?type=business).

export default function Landing() {
  return (
    <>
      <Hero />
      <LogosStrip />
      <StatsBand />
      <Features />
      <HowItWorks />
      <ChancePreview />
      <DiscoverPreview />
      <ForSchools />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}

/* ----------------------------- HERO ----------------------------- */
function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ambient glow — drifts slowly, disabled for reduced motion */}
      <div
        aria-hidden
        className="hero-glow"
        style={{
          position: 'absolute',
          inset: '-20% -10%',
          background:
            'radial-gradient(900px 420px at 78% -8%, rgba(69,133,217,0.16), transparent 60%), radial-gradient(760px 460px at 6% 4%, rgba(69,133,217,0.09), transparent 55%), radial-gradient(520px 320px at 92% 60%, rgba(192,138,45,0.09), transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div className="wrap" style={{ position: 'relative', padding: '84px 24px 72px' }}>
        <div style={{ maxWidth: 780 }}>
          <span className="pill pill-gold hero-rise" style={{ marginBottom: 22 }}>
            Honest admissions intelligence
          </span>
          <h1
            className="hero-rise"
            style={{
              fontSize: 'clamp(38px, 6vw, 68px)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              animationDelay: '0.05s',
            }}
          >
            Build the portfolio that{' '}
            <span style={{ color: 'var(--primary)' }}>actually gets you in.</span>
          </h1>
          <p
            className="muted hero-rise"
            style={{ fontSize: 'clamp(16.5px, 2.4vw, 20px)', lineHeight: 1.55, marginTop: 24, maxWidth: 620, animationDelay: '0.12s' }}
          >
            Folio turns your grades, tests, activities and awards into a
            Common&nbsp;App–grade portfolio — then gives you honest AI feedback,
            real admission odds, and the exact olympiads and competitions to do
            next.
          </p>
          <div className="hero-rise" style={{ display: 'flex', gap: 12, marginTop: 34, flexWrap: 'wrap', animationDelay: '0.19s' }}>
            <Link href="/start" className="btn btn-primary">
              Create my portfolio — free
            </Link>
            <Link href="/start?type=business" className="btn btn-ghost">
              I’m a school / counselor
            </Link>
          </div>
          <p className="hero-rise" style={{ marginTop: 16, fontSize: 13.5, color: 'var(--faint)', animationDelay: '0.26s' }}>
            Free forever for the essentials. No card, no sign-up to start.
          </p>
        </div>

        <HeroCard />
      </div>
    </section>
  );
}

function HeroCard() {
  const odds = [
    ['MIT', 6, 'band-hard-reach'],
    ['UC Berkeley', 24, 'band-reach'],
    ['U Michigan', 48, 'band-target'],
    ['ASU', 91, 'band-safety'],
  ];
  return (
    <div
      className="card hero-rise"
      style={{
        marginTop: 56,
        padding: 0,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        animationDelay: '0.3s',
      }}
    >
      {/* floating premium chip */}
      <span
        aria-hidden
        className="pill pill-gold chip-float"
        style={{ position: 'absolute', top: -12, right: 22, boxShadow: 'var(--shadow)', zIndex: 2 }}
      >
        No glaze — honest odds
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 20px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface-2)',
        }}
      >
        <Dot c="#e6685f" />
        <Dot c="#e3b341" />
        <Dot c="#57b365" />
        <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--muted)' }}>
          folio · your portfolio
        </span>
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 0 }}
        className="hero-grid"
      >
        <div style={{ padding: 28, borderRight: '1px solid var(--line)' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>AI feedback</div>
          <p style={{ marginTop: 10, fontSize: 16, lineHeight: 1.5 }}>
            “Strong STEM core, but your activities read as
            <em> membership, not leadership</em>. Turn the robotics club into a
            measurable project and target a national olympiad to convert a good
            profile into a competitive one.”
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            <span className="pill band-reach">Raise SAT → 1500+</span>
            <span className="pill band-target">Lead a project</span>
            <span className="pill pill-gold">Enter USACO</span>
          </div>
        </div>
        <div style={{ padding: 28, background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Admission odds</div>
          {odds.map(([name, pct, band], i) => (
            <div
              key={name}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14 }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 600, width: 96 }}>{name}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
                <div
                  className={`barfill bar-animate ${band}`}
                  style={{ width: `${pct}%`, height: '100%', animationDelay: `${0.55 + i * 0.14}s` }}
                />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, width: 38, textAlign: 'right' }}>{pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .barfill.band-hard-reach{background:var(--bad)}
        .barfill.band-reach{background:var(--warn)}
        .barfill.band-target{background:var(--primary)}
        .barfill.band-safety{background:var(--good)}
        @media (max-width:720px){.hero-grid{grid-template-columns:1fr}.hero-grid>div{border-right:0!important;border-bottom:1px solid var(--line)}}
      `}</style>
    </div>
  );
}

function Dot({ c }) {
  return (
    <span style={{ width: 11, height: 11, borderRadius: 999, background: c, display: 'inline-block' }} />
  );
}

/* --------------------------- LOGOS --------------------------- */
function LogosStrip() {
  const names = ['Harvard', 'MIT', 'Stanford', 'Oxford', 'UC Berkeley', 'NYU', 'Toronto'];
  return (
    <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
      <div
        className="wrap"
        style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <span style={{ fontSize: 12.5, color: 'var(--faint)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Benchmarked against
        </span>
        {names.map((n) => (
          <span key={n} style={{ fontFamily: 'var(--display)', fontSize: 19, color: 'var(--muted)', fontWeight: 500 }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- STATS --------------------------- */
function StatsBand() {
  const stats = [
    [`${UNIVERSITIES.length}+`, 'universities with live odds'],
    [`${COMPETITIONS.length}+`, 'olympiads, programs & scholarships'],
    ['3', 'AI tools: review, essay coach, counselor'],
    ['$0', 'to build your full portfolio'],
  ];
  return (
    <section style={{ padding: '46px 0' }}>
      <div className="wrap">
        <Reveal>
          <div className="stats-band">
            {stats.map(([n, label]) => (
              <div key={label} style={{ textAlign: 'center', padding: '6px 10px' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px,3.4vw,38px)', color: 'var(--primary)' }}>{n}</div>
                <div className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.4 }}>{label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <style>{`
        .stats-band{display:grid; grid-template-columns:repeat(4,1fr); gap:12px;}
        @media (max-width:760px){.stats-band{grid-template-columns:repeat(2,1fr); gap:20px;}}
      `}</style>
    </section>
  );
}

/* --------------------------- FEATURES --------------------------- */
function Features() {
  const items = [
    {
      glyph: '¶',
      title: 'A real Common App–style portfolio',
      body: 'Structured sections for academics, testing, 10 activities and 5 honors — the exact shape top universities read.',
    },
    {
      glyph: '✎',
      title: 'AI rewrites every entry',
      body: '“Started a club” becomes a line that shows scope, skills and measurable impact — without inventing anything.',
    },
    {
      glyph: '%',
      title: 'Honest admission odds',
      body: 'Per-university chances grounded in your real profile. Harvard caps low even for strong applicants — because it should.',
    },
    {
      glyph: '→',
      title: 'Personalised next moves',
      body: 'Specific olympiads, research programs and score targets — plus deadline tracking so you never miss a window.',
    },
  ];
  return (
    <section className="section" style={{ paddingTop: 42 }}>
      <div className="wrap">
        <Reveal>
          <Header
            eyebrow="What Folio does"
            title="Everything between “good student” and “admitted”."
            sub="Most applicants have the raw material. Folio is the layer that turns it into an application that reads as exceptional."
          />
        </Reveal>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: 18, marginTop: 44 }}
        >
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 90}>
              <div className="card card-pad feature-card" style={{ height: '100%' }}>
                <div
                  aria-hidden
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--primary-tint)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--display)',
                    fontSize: 22,
                  }}
                >
                  {it.glyph}
                </div>
                <h3 style={{ fontSize: 20, marginTop: 16 }}>{it.title}</h3>
                <p className="muted" style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.55 }}>
                  {it.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <style>{`
        .feature-card{transition:transform .2s ease, box-shadow .2s ease;}
        .feature-card:hover{transform:translateY(-4px); box-shadow:var(--shadow);}
        @media (prefers-reduced-motion: reduce){.feature-card:hover{transform:none;}}
      `}</style>
    </section>
  );
}

/* ------------------------- HOW IT WORKS ------------------------- */
function HowItWorks() {
  const steps = [
    ['Fill in your portfolio', 'Grades, SAT/IELTS, activities and awards — guided, section by section.'],
    ['Get AI feedback', 'An honest read on your strengths, gaps and the highest-impact things to fix.'],
    ['See your real chances', 'Live odds across 100+ universities that update as your profile grows.'],
    ['Do the right things next', 'Pick from a curated database of olympiads, competitions and programs.'],
  ];
  return (
    <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="wrap">
        <Reveal>
          <Header eyebrow="How it works" title="Four steps from blank page to a sharper application." />
        </Reveal>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 22, marginTop: 44 }}
        >
          {steps.map(([t, b], i) => (
            <Reveal key={t} delay={i * 90}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--primary-tint)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--display)',
                  fontWeight: 600,
                  fontSize: 20,
                }}
              >
                {i + 1}
              </div>
              <h3 style={{ fontSize: 18.5, marginTop: 16 }}>{t}</h3>
              <p className="muted" style={{ marginTop: 7, fontSize: 14.5, lineHeight: 1.55 }}>
                {b}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------ CHANCE PREVIEW ------------------------ */
function ChancePreview() {
  return (
    <section className="section">
      <div className="wrap chance-grid">
        <Reveal>
          <span className="eyebrow">No glaze, ever</span>
          <h2 style={{ fontSize: 'clamp(28px,3.6vw,40px)', marginTop: 14 }}>
            Odds you can actually trust.
          </h2>
          <p className="muted" style={{ marginTop: 16, fontSize: 16.5, lineHeight: 1.6 }}>
            Other tools tell everyone they’re “competitive.” Folio doesn’t. We
            start from each school’s real acceptance rate, compare your profile
            to its admitted students, and cap the number where reality caps it.
          </p>
          <ul style={{ marginTop: 20, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
            {[
              'Even a near-perfect profile tops out around 20% at the most selective schools.',
              'Targets and safeties are flagged honestly so your list is balanced.',
              'Every gap comes with a concrete way to close it.',
            ].map((t) => (
              <li key={t} style={{ display: 'flex', gap: 10, fontSize: 15 }}>
                <span style={{ color: 'var(--good)', fontWeight: 700 }}>✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Link href="/universities" className="btn btn-ghost" style={{ marginTop: 26 }}>
            See my chances →
          </Link>
        </Reveal>
        <Reveal delay={120}>
          <div className="card card-pad" style={{ boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              Same strong applicant, four schools
            </div>
            {[
              ['Harvard', 5, 'Hard reach', 'band-hard-reach'],
              ['Carnegie Mellon', 19, 'Reach', 'band-reach'],
              ['U Michigan', 46, 'Target', 'band-target'],
              ['Georgia Tech', 63, 'Safety', 'band-safety'],
            ].map(([n, p, label, band], i) => (
              <div key={n} style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, fontSize: 15.5 }}>{n}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`pill ${band}`}>{label}</span>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 18 }}>{p}%</span>
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--line)', marginTop: 8, overflow: 'hidden' }}>
                  <div className={`barfill bar-animate ${band}`} style={{ width: `${p}%`, height: '100%', animationDelay: `${i * 0.12}s` }} />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <style>{`
        .chance-grid{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:48px; align-items:center;}
        .barfill.band-hard-reach{background:var(--bad)}.barfill.band-reach{background:var(--warn)}
        .barfill.band-target{background:var(--primary)}.barfill.band-safety{background:var(--good)}
        @media (max-width:860px){.chance-grid{grid-template-columns:1fr; gap:28px;}}
      `}</style>
    </section>
  );
}

/* ----------------------- DISCOVER PREVIEW ----------------------- */
function DiscoverPreview() {
  const tags = ['IMO', 'USACO', 'Regeneron ISEF', 'John Locke Essay', 'RSI', 'Wharton Investment', 'Diamond Challenge', 'YYGS'];
  return (
    <section className="section" style={{ background: 'var(--primary)', color: '#fff' }}>
      <div className="wrap" style={{ textAlign: 'center' }}>
        <Reveal>
          <span className="eyebrow" style={{ color: '#f3d9a4' }}>The opportunities database</span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(28px,3.8vw,42px)', marginTop: 14, maxWidth: 720, marginInline: 'auto' }}>
            Stop wondering what to do this summer.
          </h2>
          <p style={{ marginTop: 16, fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)', maxWidth: 620, marginInline: 'auto' }}>
            A curated library of olympiads, research programs, competitions and
            scholarships — with deadline tracking, so the window never closes on
            you quietly.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 28, maxWidth: 680, marginInline: 'auto' }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '8px 15px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <Link href="/discover" className="btn btn-gold" style={{ marginTop: 32 }}>
            Browse the database
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------- FOR SCHOOLS & COUNSELORS ---------------------- */
function ForSchools() {
  const roster = [
    ['Aisha K.', 74, ['No essay draft'], 'var(--good)'],
    ['Timur B.', 52, ['No SAT/ACT', 'Membership, not leadership'], 'var(--primary)'],
    ['Dana S.', 31, ['No GPA', 'No honors'], 'var(--warn)'],
  ];
  return (
    <section id="schools" className="section" style={{ background: 'var(--ink)', color: '#fff' }}>
      <div className="wrap schools-grid">
        <Reveal>
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>For schools & counselors</span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(28px,3.6vw,40px)', marginTop: 14 }}>
            Your whole cohort, one honest dashboard.
          </h2>
          <p style={{ marginTop: 16, fontSize: 16.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)' }}>
            Stop chasing students for spreadsheets. See every portfolio, its
            strength and its gaps in real time — and walk into each meeting
            already knowing what to discuss.
          </p>
          <ul style={{ marginTop: 20, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
            {[
              'Roster with attention flags: no GPA, no essay, weak leadership',
              'Read-only portfolios + comments students see in their builder',
              'Suggested next steps per student, generated from their gaps',
              'White-label: your brand on portfolios and PDFs (Business)',
            ].map((t) => (
              <li key={t} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <Link href="/start?type=business" className="btn btn-gold">
              Create a workspace — free
            </Link>
            <Link href="/upgrade?plan=business" className="btn" style={{ border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
              See Business plan
            </Link>
          </div>
        </Reveal>

        {/* mini dashboard mockup */}
        <Reveal delay={140}>
          <div className="card" style={{ padding: 18, background: 'var(--surface)', color: 'var(--ink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>Students (12)</span>
              <span className="pill pill-muted" style={{ fontSize: 11 }}>Needs attention first</span>
            </div>
            {roster.map(([name, strength, flags, color]) => (
              <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    border: `4px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {strength}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{name}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                    {flags.map((f) => (
                      <span key={f} className="pill band-reach" style={{ fontSize: 10 }}>{f}</span>
                    ))}
                    {flags.length === 0 && <span className="pill band-safety" style={{ fontSize: 10 }}>On track</span>}
                  </div>
                </div>
                <span style={{ color: 'var(--faint)' }}>›</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--accent-tint)', fontSize: 12.5, lineHeight: 1.5 }}>
              💬 “Dana: let’s get your GPA in before Friday’s meeting — then we
              pick your first olympiad.”
            </div>
          </div>
        </Reveal>
      </div>
      <style>{`
        .schools-grid{display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,0.95fr); gap:48px; align-items:center;}
        @media (max-width:860px){.schools-grid{grid-template-columns:1fr; gap:32px;}}
      `}</style>
    </section>
  );
}

/* ------------------------------ PRICING ------------------------------ */
function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <span className="eyebrow">Pricing</span>
            <h2 style={{ fontSize: 'clamp(28px,3.8vw,42px)', marginTop: 14 }}>
              Start free. Upgrade when it earns it.
            </h2>
            <p className="muted" style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.6 }}>
              The builder, honest odds and AI review are free — no card, no trial
              clock. Pay only for depth: your personal AI counselor, essay coach,
              and the tools schools run cohorts on.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <PricingCards />
        </Reveal>
        <Reveal delay={200}>
          <p className="muted" style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5 }}>
            Questions, school pilots, local payment methods?{' '}
            <a href="mailto:hello@folio.app" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              hello@folio.app
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ FAQ ------------------------------ */
function FAQ() {
  const items = [
    [
      'Is Folio really free?',
      'Yes. The portfolio builder, admission chances for every university, AI review and the opportunities database are free with no time limit and no card. Pro adds the AI essay coach, the counselor chat and clean exports — you only pay for depth.',
    ],
    [
      'Where do the admission odds come from?',
      'Each estimate starts from the university’s published acceptance rate, then adjusts for how your GPA, test scores and profile strength compare to its typical admitted student. The number is capped where reality caps it — nobody gets told 60% at Harvard.',
    ],
    [
      'Can my counselor or school see my portfolio?',
      'Only if you connect to their workspace with an invite code — and you can disconnect in one click, which removes their access immediately. Nothing is public unless you create a share link yourself.',
    ],
    [
      'How do schools and counselors use Folio?',
      'You create a free workspace, students join with your code, and you see the whole roster: strength, completeness, attention flags and suggested talking points. The free pilot covers 3 students; Business unlocks your full cohort, CSV export and white-label.',
    ],
    [
      'How do payments work?',
      'Card checkout activates your plan automatically within a couple of minutes. In Kazakhstan and the CIS we also accept local methods (Kaspi) — write to hello@folio.app and we activate the plan the same day.',
    ],
  ];
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap" style={{ maxWidth: 760 }}>
        <Reveal>
          <div style={{ textAlign: 'center' }}>
            <span className="eyebrow">FAQ</span>
            <h2 style={{ fontSize: 'clamp(26px,3.4vw,36px)', marginTop: 14 }}>Fair questions.</h2>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div style={{ marginTop: 32, display: 'grid', gap: 10 }}>
            {items.map(([q, a]) => (
              <details key={q} className="faq-item card">
                <summary>
                  {q}
                  <span aria-hidden className="faq-chevron">▾</span>
                </summary>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6, padding: '0 20px 18px' }}>{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
      <style>{`
        .faq-item{overflow:hidden;}
        .faq-item summary{
          list-style:none; cursor:pointer; display:flex; align-items:center;
          justify-content:space-between; gap:14px; padding:16px 20px;
          font-weight:600; font-size:15.5px;
        }
        .faq-item summary::-webkit-details-marker{display:none;}
        .faq-chevron{color:var(--faint); transition:transform .2s ease;}
        .faq-item[open] .faq-chevron{transform:rotate(180deg);}
      `}</style>
    </section>
  );
}

/* ------------------------------ CTA ------------------------------ */
function CTA() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <Reveal>
          <div
            className="card"
            style={{
              padding: 'clamp(36px, 6vw, 56px) clamp(20px, 5vw, 40px)',
              textAlign: 'center',
              background: 'linear-gradient(180deg, var(--surface), var(--surface-2))',
            }}
          >
            <h2 style={{ fontSize: 'clamp(30px,4vw,46px)', maxWidth: 640, marginInline: 'auto' }}>
              Your application is a story. Let’s make it a strong one.
            </h2>
            <p className="muted" style={{ marginTop: 16, fontSize: 17 }}>
              Start free — it takes about ten minutes to see your first results.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
              <Link href="/start" className="btn btn-primary">
                Build my portfolio
              </Link>
              <Link href="/start?type=business" className="btn btn-ghost">
                For schools & counselors
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ FOOTER ------------------------------ */
function Footer() {
  const cols = [
    {
      title: 'Product',
      links: [
        ['Portfolio builder', '/start'],
        ['Admission chances', '/universities'],
        ['Opportunities', '/discover'],
        ['Pricing', '/upgrade'],
      ],
    },
    {
      title: 'For schools',
      links: [
        ['Create a workspace', '/start?type=business'],
        ['Business plan', '/upgrade?plan=business'],
        ['Counselor dashboard', '/counselor'],
      ],
    },
    {
      title: 'Account',
      links: [
        ['Sign in', '/login'],
        ['My portfolio', '/portfolio'],
      ],
    },
  ];
  return (
    <footer style={{ borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
      <div className="wrap footer-grid" style={{ padding: '46px 24px 20px' }}>
        <div>
          <span style={{ fontFamily: 'var(--display)', fontSize: 21, fontWeight: 600 }}>Folio</span>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.6, maxWidth: 260 }}>
            Honest admissions intelligence for students applying abroad — and the
            counselors who guide them.
          </p>
          <a href="mailto:hello@folio.app" style={{ display: 'inline-block', marginTop: 12, fontSize: 13.5, color: 'var(--primary)', fontWeight: 600 }}>
            hello@folio.app
          </a>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--faint)' }}>
              {c.title}
            </div>
            <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
              {c.links.map(([label, href]) => (
                <Link key={href + label} href={href} style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="wrap" style={{ padding: '16px 24px 30px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: 'var(--faint)' }}>© {new Date().getFullYear()} Folio</span>
        <span style={{ fontSize: 12.5, color: 'var(--faint)', maxWidth: 560 }}>
          Estimates are guidance, not guarantees. Always verify deadlines and requirements with the source.
        </span>
      </div>
      <style>{`
        .footer-grid{display:grid; grid-template-columns:1.4fr 1fr 1fr 1fr; gap:28px;}
        @media (max-width:760px){.footer-grid{grid-template-columns:1fr 1fr;}}
        @media (max-width:480px){.footer-grid{grid-template-columns:1fr;}}
      `}</style>
    </footer>
  );
}

/* ----------------------------- shared ----------------------------- */
function Header({ eyebrow, title, sub }) {
  return (
    <div style={{ maxWidth: 680 }}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 style={{ fontSize: 'clamp(28px,3.6vw,40px)', marginTop: 14 }}>{title}</h2>
      {sub && (
        <p className="muted" style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.6 }}>
          {sub}
        </p>
      )}
    </div>
  );
}
