import Link from 'next/link';

export default function Landing() {
  return (
    <>
      <Hero />
      <LogosStrip />
      <Features />
      <HowItWorks />
      <ChancePreview />
      <DiscoverPreview />
      <CTA />
      <Footer />
    </>
  );
}

/* ----------------------------- HERO ----------------------------- */
function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(900px 420px at 78% -8%, rgba(69,133,217,0.16), transparent 60%), radial-gradient(760px 460px at 6% 4%, rgba(69,133,217,0.10), transparent 55%)',
        }}
      />
      <div
        className="wrap"
        style={{ position: 'relative', padding: '78px 24px 70px' }}
      >
        <div style={{ maxWidth: 760 }}>
          <span className="pill pill-gold" style={{ marginBottom: 22 }}>
            For students applying abroad
          </span>
          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 68px)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
            }}
          >
            Build the portfolio that
            <br />
            <span style={{ color: 'var(--primary)' }}>actually gets you in.</span>
          </h1>
          <p
            className="muted"
            style={{ fontSize: 20, lineHeight: 1.55, marginTop: 24, maxWidth: 620 }}
          >
            Folio turns your grades, tests, activities and awards into a
            Common&nbsp;App–grade portfolio — then gives you honest AI feedback,
            real admission odds, and the exact olympiads and competitions to do
            next.
          </p>
          <div
            style={{ display: 'flex', gap: 12, marginTop: 34, flexWrap: 'wrap' }}
          >
            <Link href="/start" className="btn btn-primary">
              Create my portfolio — free
            </Link>
            <Link href="/universities" className="btn btn-ghost">
              See my chances
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 13.5, color: 'var(--faint)' }}>
            No sign-up. Your portfolio saves to this device.
          </p>
        </div>

        <HeroCard />
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div
      className="card fade-in"
      style={{
        marginTop: 56,
        padding: 0,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
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
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)',
          gap: 0,
        }}
        className="hero-grid"
      >
        <div style={{ padding: 28, borderRight: '1px solid var(--line)' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
            AI feedback
          </div>
          <p style={{ marginTop: 10, fontSize: 16, lineHeight: 1.5 }}>
            “Strong STEM core, but your activities read as
            <em> membership, not leadership</em>. Turn the robotics club into a
            measurable project and target a national olympiad to convert a good
            profile into a competitive one.”
          </p>
          <div
            style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}
          >
            <span className="pill band-reach">Raise SAT → 1500+</span>
            <span className="pill band-target">Lead a project</span>
            <span className="pill pill-gold">Enter USACO</span>
          </div>
        </div>
        <div style={{ padding: 28, background: 'var(--surface-2)' }}>
          <div
            style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}
          >
            Admission odds
          </div>
          {[
            ['MIT', 6, 'band-hard-reach'],
            ['UC Berkeley', 24, 'band-reach'],
            ['U Michigan', 48, 'band-target'],
            ['ASU', 91, 'band-safety'],
          ].map(([name, pct, band]) => (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 14,
              }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 600, width: 96 }}>
                {name}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 999,
                  background: 'var(--line)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className={`barfill ${band}`}
                  style={{ width: `${pct}%`, height: '100%' }}
                />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, width: 38, textAlign: 'right' }}>
                {pct}%
              </span>
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
    <span
      style={{ width: 11, height: 11, borderRadius: 999, background: c, display: 'inline-block' }}
    />
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

/* --------------------------- FEATURES --------------------------- */
function Features() {
  const items = [
    {
      icon: '📝',
      title: 'A real Common App–style portfolio',
      body: 'Structured sections for academics, testing, 10 activities and 5 honors — the exact shape top universities read.',
    },
    {
      icon: '✨',
      title: 'AI rewrites every entry',
      body: '“Started a club” becomes a line that shows scope, skills and measurable impact — without inventing anything.',
    },
    {
      icon: '🎯',
      title: 'Honest admission odds',
      body: 'Per-university chances grounded in your real profile. Harvard caps low even for strong applicants — because it should.',
    },
    {
      icon: '🧭',
      title: 'Personalised next moves',
      body: 'Specific olympiads, research programs and score targets — ranked by how much they’ll actually move your odds.',
    },
  ];
  return (
    <section className="section">
      <div className="wrap">
        <Header
          eyebrow="What Folio does"
          title="Everything between “good student” and “admitted”."
          sub="Most applicants have the raw material. Folio is the layer that turns it into an application that reads as exceptional."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))',
            gap: 18,
            marginTop: 44,
          }}
        >
          {items.map((it) => (
            <div key={it.title} className="card card-pad">
              <div style={{ fontSize: 26 }}>{it.icon}</div>
              <h3 style={{ fontSize: 20, marginTop: 14 }}>{it.title}</h3>
              <p className="muted" style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.55 }}>
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- HOW IT WORKS ------------------------- */
function HowItWorks() {
  const steps = [
    ['Fill in your portfolio', 'Grades, SAT/IELTS, activities and awards — guided, section by section.'],
    ['Get AI feedback', 'An honest read on your strengths, gaps and the highest-impact things to fix.'],
    ['See your real chances', 'Live odds across 25+ universities that update as your profile grows.'],
    ['Do the right things next', 'Pick from a curated database of olympiads, competitions and programs.'],
  ];
  return (
    <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="wrap">
        <Header eyebrow="How it works" title="Four steps from blank page to a sharper application." />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 22,
            marginTop: 44,
          }}
        >
          {steps.map(([t, b], i) => (
            <div key={t}>
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
            </div>
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
      <div
        className="wrap"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: 48,
          alignItems: 'center',
        }}
      >
        <div>
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
        </div>
        <div className="card card-pad" style={{ boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
            Same strong applicant, four schools
          </div>
          {[
            ['Harvard', 5, 'Hard reach', 'band-hard-reach'],
            ['Carnegie Mellon', 19, 'Reach', 'band-reach'],
            ['U Michigan', 46, 'Target', 'band-target'],
            ['Georgia Tech', 63, 'Safety', 'band-safety'],
          ].map(([n, p, label, band]) => (
            <div key={n} style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, fontSize: 15.5 }}>{n}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`pill ${band}`}>{label}</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 18 }}>{p}%</span>
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'var(--line)', marginTop: 8, overflow: 'hidden' }}>
                <div className={`barfill ${band}`} style={{ width: `${p}%`, height: '100%' }} />
              </div>
            </div>
          ))}
          <style>{`.barfill.band-hard-reach{background:var(--bad)}.barfill.band-reach{background:var(--warn)}.barfill.band-target{background:var(--primary)}.barfill.band-safety{background:var(--good)}`}</style>
        </div>
      </div>
    </section>
  );
}

/* ----------------------- DISCOVER PREVIEW ----------------------- */
function DiscoverPreview() {
  const tags = ['IMO', 'USACO', 'Regeneron ISEF', 'John Locke Essay', 'RSI', 'Wharton Investment', 'Diamond Challenge', 'YYGS'];
  return (
    <section className="section" style={{ background: 'var(--primary)', color: '#fff' }}>
      <div className="wrap" style={{ textAlign: 'center' }}>
        <span className="eyebrow" style={{ color: 'var(--accent)' }}>
          The opportunities database
        </span>
        <h2 style={{ color: '#fff', fontSize: 'clamp(28px,3.8vw,42px)', marginTop: 14, maxWidth: 720, marginInline: 'auto' }}>
          Stop wondering what to do this summer.
        </h2>
        <p style={{ marginTop: 16, fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)', maxWidth: 620, marginInline: 'auto' }}>
          A curated library of olympiads, research programs, competitions and
          scholarships — filterable by field, level and cost. The same pool the
          AI recommends from.
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
      </div>
    </section>
  );
}

/* ------------------------------ CTA ------------------------------ */
function CTA() {
  return (
    <section className="section">
      <div className="wrap">
        <div
          className="card"
          style={{
            padding: '56px 40px',
            textAlign: 'center',
            background:
              'linear-gradient(180deg, var(--surface), var(--surface-2))',
          }}
        >
          <h2 style={{ fontSize: 'clamp(30px,4vw,46px)', maxWidth: 640, marginInline: 'auto' }}>
            Your application is a story. Let’s make it a strong one.
          </h2>
          <p className="muted" style={{ marginTop: 16, fontSize: 17 }}>
            Start free — it takes about ten minutes to see your first results.
          </p>
          <Link href="/start" className="btn btn-primary" style={{ marginTop: 28 }}>
            Build my portfolio
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
      <div
        className="wrap"
        style={{ padding: '34px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}
      >
        <span style={{ fontFamily: 'var(--display)', fontSize: 19, fontWeight: 600 }}>Folio</span>
        <span style={{ fontSize: 13.5, color: 'var(--faint)' }}>
          Estimates are guidance, not guarantees. Always verify deadlines and requirements with the source.
        </span>
      </div>
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
