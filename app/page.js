import Link from 'next/link';
import Reveal from '@/components/Reveal';
import PricingCards from '@/components/Pricing';
import { UNIVERSITIES } from '@/lib/universities';
import { COMPETITIONS } from '@/lib/competitions';

// Landing — server component, fully static. Two audiences, one page:
// students (primary funnel → /start) and schools/counselors (→ /start?type=business).
// Deliberate rule: the landing never deep-links into app surfaces like the
// universities or opportunities pages — it sells the value, the funnel is
// /start. Anchors: #product, #schools, #pricing, #faq.

export default function Landing() {
  return (
    <>
      <Hero />
      <Marquee />
      <Product />
      <HowItWorks />
      <Honesty />
      <ForSchools />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}

/* ================================ HERO ================================ */

function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ambient glow + dot grid */}
      <div
        aria-hidden
        className="hero-glow"
        style={{
          position: 'absolute',
          inset: '-30% -20%',
          background:
            'radial-gradient(1000px 500px at 50% -12%, rgba(69,133,217,0.17), transparent 62%), radial-gradient(700px 420px at 12% 30%, rgba(192,138,45,0.10), transparent 58%), radial-gradient(640px 400px at 88% 22%, rgba(69,133,217,0.10), transparent 58%)',
          pointerEvents: 'none',
        }}
      />
      <div aria-hidden className="dotgrid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <div className="wrap" style={{ position: 'relative', padding: '92px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 840, marginInline: 'auto' }}>
          <span className="pill pill-gold hero-rise" style={{ marginBottom: 24 }}>
            ✦ Honest admissions intelligence
          </span>
          <h1
            className="hero-rise"
            style={{
              fontSize: 'clamp(40px, 6.6vw, 76px)',
              lineHeight: 1.02,
              letterSpacing: '-0.028em',
              animationDelay: '0.05s',
            }}
          >
            The portfolio that
            <br />
            <span className="grad-text">actually gets you in.</span>
          </h1>
          <p
            className="muted hero-rise"
            style={{
              fontSize: 'clamp(16.5px, 2.3vw, 20px)',
              lineHeight: 1.55,
              marginTop: 26,
              maxWidth: 640,
              marginInline: 'auto',
              animationDelay: '0.12s',
            }}
          >
            Folio turns your grades, activities and awards into a
            Common&nbsp;App–grade portfolio — then tells you the truth: honest
            AI feedback, real admission odds, and exactly what to do next.
          </p>
          <div
            className="hero-rise"
            style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center', animationDelay: '0.19s' }}
          >
            <Link href="/start" className="btn btn-primary" style={{ padding: '14px 30px', fontSize: 16 }}>
              Build my portfolio — free
            </Link>
            <Link href="/start?type=business" className="btn btn-ghost" style={{ padding: '14px 26px', fontSize: 16 }}>
              I’m a school / counselor
            </Link>
          </div>
          <p className="hero-rise" style={{ marginTop: 18, fontSize: 13.5, color: 'var(--faint)', animationDelay: '0.26s' }}>
            Free forever for the essentials · no card · first results in ~10 minutes
          </p>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  const odds = [
    ['MIT', 6, 'band-hard-reach', 'Hard reach'],
    ['UC Berkeley', 24, 'band-reach', 'Reach'],
    ['U Michigan', 48, 'band-target', 'Target'],
    ['ASU', 91, 'band-safety', 'Safety'],
  ];
  return (
    <div className="hero-stage hero-rise" style={{ animationDelay: '0.32s' }}>
      {/* ghost cards behind, for depth */}
      <div aria-hidden className="hero-ghost hg-left" />
      <div aria-hidden className="hero-ghost hg-right" />

      {/* floating chips */}
      <span aria-hidden className="pill pill-gold chip-float hero-chip hc-1">
        ✎ Essay coach
      </span>
      <span aria-hidden className="pill band-safety chip-float hero-chip hc-2" style={{ animationDelay: '1.2s' }}>
        ✓ No invented facts
      </span>
      <span aria-hidden className="pill band-reach chip-float hero-chip hc-3" style={{ animationDelay: '2.1s' }}>
        🗓 USACO ≈ Dec
      </span>

      <div className="card hero-shot" style={{ textAlign: 'left' }}>
        <div className="hero-bar">
          <span className="hero-dot" style={{ background: '#e6685f' }} />
          <span className="hero-dot" style={{ background: '#e3b341' }} />
          <span className="hero-dot" style={{ background: '#57b365' }} />
          <span style={{ marginLeft: 10, fontSize: 12.5, color: 'var(--muted)' }}>
            folio — your portfolio
          </span>
          <span className="pill pill-gold" style={{ marginLeft: 'auto', fontSize: 10.5 }}>
            Strength 68/100
          </span>
        </div>
        <div className="hero-grid">
          <div style={{ padding: '26px 28px', borderRight: '1px solid var(--line)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              AI feedback
            </div>
            <p style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.55 }}>
              “Strong STEM core, but your activities read as{' '}
              <em>membership, not leadership</em>. Turn the robotics club into a
              measurable project and target a national olympiad to convert a
              good profile into a competitive one.”
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <span className="pill band-reach">Raise SAT → 1500+</span>
              <span className="pill band-target">Lead a project</span>
              <span className="pill pill-gold">Enter USACO</span>
            </div>
          </div>
          <div style={{ padding: '26px 28px', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Admission odds
            </div>
            {odds.map(([name, pct, band, label], i) => (
              <div key={name} style={{ marginTop: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 650 }}>{name}</span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`pill ${band}`} style={{ fontSize: 10.5 }}>{label}</span>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 15 }}>{pct}%</span>
                  </span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: 'var(--line)', overflow: 'hidden', marginTop: 6 }}>
                  <div
                    className={`barfill bar-animate ${band}`}
                    style={{ width: `${pct}%`, height: '100%', animationDelay: `${0.6 + i * 0.14}s` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .hero-stage{position:relative; max-width:880px; margin:64px auto 0;}
        .hero-shot{padding:0; overflow:hidden; box-shadow:var(--shadow-lg); position:relative; z-index:2;}
        .hero-bar{display:flex; align-items:center; gap:7px; padding:13px 20px;
          border-bottom:1px solid var(--line); background:var(--surface-2);}
        .hero-dot{width:10px; height:10px; border-radius:999px; display:inline-block;}
        .hero-grid{display:grid; grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);}
        .hero-ghost{position:absolute; border-radius:var(--r-lg); background:var(--surface);
          border:1px solid var(--line); box-shadow:var(--shadow); z-index:1;}
        .hg-left{width:200px; height:250px; left:-56px; top:44px; transform:rotate(-7deg); opacity:0.65;}
        .hg-right{width:220px; height:230px; right:-62px; top:70px; transform:rotate(6deg); opacity:0.65;}
        .hero-chip{position:absolute; z-index:3; box-shadow:var(--shadow); font-size:12.5px;}
        .hc-1{top:-14px; left:8%;}
        .hc-2{top:34%; right:-3%;}
        .hc-3{bottom:-14px; left:16%;}
        .barfill.band-hard-reach{background:var(--bad)}
        .barfill.band-reach{background:var(--warn)}
        .barfill.band-target{background:var(--primary)}
        .barfill.band-safety{background:var(--good)}
        @media (max-width:860px){
          .hero-ghost{display:none;}
          .hc-2{right:2%;}
        }
        @media (max-width:720px){
          .hero-grid{grid-template-columns:1fr;}
          .hero-grid>div{border-right:0!important; border-bottom:1px solid var(--line);}
          .hero-chip{display:none;}
        }
      `}</style>
    </div>
  );
}

/* ============================== MARQUEE ============================== */

function Marquee() {
  const names = [
    'Harvard', 'MIT', 'Stanford', 'Oxford', 'Cambridge', 'UC Berkeley',
    'NYU', 'Toronto', 'ETH Zürich', 'NUS', 'Caltech', 'Imperial College',
  ];
  const row = names.map((n) => (
    <span key={n} style={{ fontFamily: 'var(--display)', fontSize: 19, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
      {n}
    </span>
  ));
  return (
    <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--surface)', padding: '20px 0' }}>
      <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--faint)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
        Odds benchmarked against admitted classes at
      </p>
      <div className="marquee">
        <div className="marquee-track" aria-hidden>
          {row}
          {names.map((n) => (
            <span key={`${n}-2`} style={{ fontFamily: 'var(--display)', fontSize: 19, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ PRODUCT BENTO ============================ */

function Product() {
  return (
    <section className="section" id="product">
      <div className="wrap">
        <Reveal>
          <div style={{ maxWidth: 700 }}>
            <span className="eyebrow">What Folio does</span>
            <h2 style={{ fontSize: 'clamp(30px,4vw,44px)', marginTop: 14, letterSpacing: '-0.02em' }}>
              Everything between “good student” and “admitted”.
            </h2>
            <p className="muted" style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.6, maxWidth: 620 }}>
              Most applicants have the raw material. Folio is the layer that
              turns it into an application that reads as exceptional — and never
              lies to you about where you stand.
            </p>
          </div>
        </Reveal>

        <div className="bento" style={{ marginTop: 44 }}>
          {/* 1 — honest odds (large) */}
          <Reveal className="b-a">
            <div className="card bento-card" style={{ height: '100%' }}>
              <BentoTag>Real admission odds</BentoTag>
              <h3 style={{ fontSize: 21, marginTop: 10 }}>Numbers capped where reality caps them.</h3>
              <p className="muted" style={{ fontSize: 14.5, marginTop: 8, lineHeight: 1.55 }}>
                Every estimate starts from the school’s true acceptance rate and
                compares you to its admitted class. Nobody gets told 60% at
                Harvard — including you.
              </p>
              <div style={{ marginTop: 20, display: 'grid', gap: 13 }}>
                {[
                  ['Harvard', 5, 'band-hard-reach', 'Hard reach'],
                  ['Carnegie Mellon', 19, 'band-reach', 'Reach'],
                  ['U Michigan', 46, 'band-target', 'Target'],
                  ['Georgia Tech', 63, 'band-safety', 'Safety'],
                ].map(([n, p, band, label]) => (
                  <div key={n}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 650, fontSize: 14.5 }}>{n}</span>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className={`pill ${band}`} style={{ fontSize: 10.5 }}>{label}</span>
                        <span style={{ fontFamily: 'var(--display)', fontSize: 16 }}>{p}%</span>
                      </span>
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: 'var(--line)', overflow: 'hidden', marginTop: 6 }}>
                      <div className={`barfill ${band}`} style={{ width: `${p}%`, height: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 2 — AI rewrites */}
          <Reveal className="b-b" delay={80}>
            <div className="card bento-card" style={{ height: '100%' }}>
              <BentoTag>AI review & polish</BentoTag>
              <h3 style={{ fontSize: 19, marginTop: 10 }}>Every entry, rewritten to carry weight.</h3>
              <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                <div style={{ padding: '11px 14px', borderRadius: 12, background: 'var(--bad-tint)', fontSize: 13.5, lineHeight: 1.5 }}>
                  <b style={{ fontSize: 11, letterSpacing: '0.06em', color: '#99293c' }}>BEFORE</b>
                  <br />“Member of robotics club”
                </div>
                <div style={{ padding: '11px 14px', borderRadius: 12, background: 'var(--good-tint)', fontSize: 13.5, lineHeight: 1.5 }}>
                  <b style={{ fontSize: 11, letterSpacing: '0.06em', color: '#1c6b48' }}>AFTER</b>
                  <br />“Led 6-person build team to a regional top-3 finish;
                  taught CAD to 12 new members”
                </div>
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
                Scope, skills, measurable impact — without inventing a single fact.
              </p>
            </div>
          </Reveal>

          {/* 3 — essay coach */}
          <Reveal className="b-c" delay={60}>
            <div className="card bento-card" style={{ height: '100%' }}>
              <BentoTag gold>Essay coach · Pro</BentoTag>
              <h3 style={{ fontSize: 19, marginTop: 10 }}>An editor that teaches, not flatters.</h3>
              <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                {[
                  ['Structure 7/10', 'band-target'],
                  ['Voice 8/10', 'band-safety'],
                  ['Specificity 4/10', 'band-hard-reach'],
                ].map(([t, band]) => (
                  <span key={t} className={`pill ${band}`} style={{ width: 'max-content' }}>{t}</span>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 12, lineHeight: 1.55 }}>
                Show-don’t-tell line edits, a before/after of your weakest
                paragraph, and the exact priorities for the next draft.
              </p>
            </div>
          </Reveal>

          {/* 4 — database (no outbound link — the funnel is /start) */}
          <Reveal className="b-d" delay={100}>
            <div className="card bento-card" style={{ height: '100%', background: 'var(--primary)', color: '#fff', border: 'none' }}>
              <BentoTag light>Inside Folio</BentoTag>
              <h3 style={{ fontSize: 19, marginTop: 10, color: '#fff' }}>
                {UNIVERSITIES.length}+ universities, {COMPETITIONS.length}+ opportunities.
              </h3>
              <p style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.55, color: 'rgba(255,255,255,0.82)' }}>
                Live odds for every school on your list, plus a curated library
                of olympiads, research programs and scholarships — matched to
                your profile, with deadline tracking so no window closes quietly.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
                {['IMO', 'USACO', 'ISEF', 'John Locke', 'RSI', 'YYGS'].map((t) => (
                  <span key={t} style={{ fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 5 — share & PDF */}
          <Reveal className="b-e" delay={140}>
            <div className="card bento-card" style={{ height: '100%' }}>
              <BentoTag>Share & export</BentoTag>
              <h3 style={{ fontSize: 19, marginTop: 10 }}>One link. One clean PDF.</h3>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>
                A curated public page for mentors and scholarships — you choose
                what’s visible — and a Common App–style PDF for every meeting.
              </p>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface-2)', fontSize: 12.5, color: 'var(--muted)' }}>
                <span aria-hidden>🔗</span> folio.app/p/ays8…e2 <span className="pill band-safety" style={{ marginLeft: 'auto', fontSize: 10 }}>live</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        .bento{display:grid; gap:18px;
          grid-template-columns:repeat(3, minmax(0,1fr));
          grid-template-areas:
            "a a b"
            "c d e";}
        .b-a{grid-area:a;} .b-b{grid-area:b;} .b-c{grid-area:c;}
        .b-d{grid-area:d;} .b-e{grid-area:e;}
        .bento-card{padding:26px; transition:transform .2s ease, box-shadow .2s ease;}
        .bento-card:hover{transform:translateY(-4px); box-shadow:var(--shadow);}
        .barfill.band-hard-reach{background:var(--bad)}
        .barfill.band-reach{background:var(--warn)}
        .barfill.band-target{background:var(--primary)}
        .barfill.band-safety{background:var(--good)}
        @media (max-width:960px){
          .bento{grid-template-columns:repeat(2, minmax(0,1fr));
            grid-template-areas:"a a" "b c" "d e";}
        }
        @media (max-width:640px){
          .bento{grid-template-columns:1fr;
            grid-template-areas:"a" "b" "c" "d" "e";}
        }
        @media (prefers-reduced-motion: reduce){.bento-card:hover{transform:none;}}
      `}</style>
    </section>
  );
}

function BentoTag({ children, gold, light }) {
  return (
    <span
      className={`pill ${gold ? 'pill-gold' : ''}`}
      style={
        light
          ? { background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: 11.5 }
          : { fontSize: 11.5 }
      }
    >
      {children}
    </span>
  );
}

/* ============================ HOW IT WORKS ============================ */

function HowItWorks() {
  const steps = [
    ['Fill in your portfolio', 'Grades, tests, activities and awards — guided, section by section.'],
    ['Get the honest read', 'AI feedback on strengths, gaps, and the highest-impact fixes.'],
    ['See your real chances', 'Live odds across 100+ universities that move as your profile grows.'],
    ['Do the right things next', 'Curated olympiads, programs and score targets — with deadlines tracked.'],
  ];
  return (
    <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="wrap">
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>
            <span className="eyebrow">How it works</span>
            <h2 style={{ fontSize: 'clamp(28px,3.6vw,40px)', marginTop: 14 }}>
              Blank page → sharper application, in four steps.
            </h2>
          </div>
        </Reveal>
        <div className="steps" style={{ marginTop: 48 }}>
          {steps.map(([t, b], i) => (
            <Reveal key={t} delay={i * 90}>
              <div className="step">
                <div className="step-num">{i + 1}</div>
                <h3 style={{ fontSize: 17.5, marginTop: 14 }}>{t}</h3>
                <p className="muted" style={{ marginTop: 7, fontSize: 14, lineHeight: 1.55 }}>{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <style>{`
        .steps{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:26px; position:relative;}
        .step{position:relative;}
        .step-num{
          width:44px; height:44px; border-radius:14px; position:relative; z-index:1;
          background:var(--primary-tint); color:var(--primary);
          display:flex; align-items:center; justify-content:center;
          font-family:var(--display); font-size:19px;
        }
        .step::after{
          content:""; position:absolute; top:22px; left:56px; right:-14px;
          border-top:2px dashed var(--line-strong);
        }
        .steps > *:last-child .step::after{display:none;}
        @media (max-width:860px){
          .steps{grid-template-columns:repeat(2, minmax(0,1fr));}
          .steps > *:nth-child(2) .step::after{display:none;}
        }
        @media (max-width:520px){
          .steps{grid-template-columns:1fr;}
          .step::after{display:none;}
        }
      `}</style>
    </section>
  );
}

/* ============================== HONESTY ============================== */

function Honesty() {
  return (
    <section className="section" style={{ background: 'var(--ink)', color: '#fff' }}>
      <div className="wrap honesty-grid">
        <Reveal>
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>The no-glaze principle</span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(28px,3.8vw,42px)', marginTop: 14, letterSpacing: '-0.02em' }}>
            Other tools tell everyone they’re “competitive”.
            <br />
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>Folio doesn’t.</span>
          </h2>
          <p style={{ marginTop: 18, fontSize: 16.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.78)', maxWidth: 520 }}>
            Flattery costs you an admit. Folio’s odds are grounded in each
            school’s real acceptance rate, your list gets balanced across reach,
            target and safety — and every gap comes with a concrete way to close
            it.
          </p>
          <ul style={{ marginTop: 22, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
            {[
              'A near-perfect profile still tops out around 20% at the most selective schools.',
              'AI feedback never invents achievements — it works with what you actually did.',
              'Every “raise this” comes with a named competition, program or score target.',
            ].map((t) => (
              <li key={t} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120}>
          <div className="card" style={{ padding: 24, background: 'var(--surface)', color: 'var(--ink)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              The same applicant, told two ways
            </div>
            <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bad-tint)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.05em', color: '#99293c' }}>TYPICAL TOOL</div>
                <p style={{ fontSize: 14.5, marginTop: 6, lineHeight: 1.5 }}>
                  “Great profile! You’re a competitive applicant for Harvard 🎉”
                </p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--good-tint)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.05em', color: '#1c6b48' }}>FOLIO</div>
                <p style={{ fontSize: 14.5, marginTop: 6, lineHeight: 1.55 }}>
                  “Harvard is a hard reach at ~5% — apply if it matters to you,
                  but win the list: two targets where you’re top-quartile, and a
                  national olympiad to lift the whole profile.”
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <style>{`
        .honesty-grid{display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,0.9fr); gap:52px; align-items:center;}
        @media (max-width:880px){.honesty-grid{grid-template-columns:1fr; gap:32px;}}
      `}</style>
    </section>
  );
}

/* ============================ FOR SCHOOLS ============================ */

function ForSchools() {
  const roster = [
    ['Aisha K.', 74, ['No essay draft'], 'var(--good)'],
    ['Timur B.', 52, ['No SAT/ACT', 'Membership, not leadership'], 'var(--primary)'],
    ['Dana S.', 31, ['No GPA', 'No honors'], 'var(--warn)'],
  ];
  return (
    <section id="schools" className="section">
      <div className="wrap schools-grid">
        {/* workspace mockup */}
        <Reveal>
          <div className="card" style={{ padding: 18, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>Students (12)</span>
              <span className="pill pill-gold" style={{ fontSize: 11 }}>Business</span>
            </div>
            {roster.map(([name, strength, flags, color]) => (
              <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 999, border: `4px solid ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, flexShrink: 0,
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
                  </div>
                </div>
                <span style={{ color: 'var(--faint)' }}>›</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--accent-tint)', fontSize: 12.5, lineHeight: 1.5 }}>
              💬 “Dana: let’s get your GPA in before Friday — then we pick your
              first olympiad.”
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <span className="eyebrow">For schools & counselors</span>
          <h2 style={{ fontSize: 'clamp(28px,3.6vw,40px)', marginTop: 14, letterSpacing: '-0.02em' }}>
            A Business Workspace that runs your whole cohort.
          </h2>
          <p className="muted" style={{ marginTop: 16, fontSize: 16.5, lineHeight: 1.6 }}>
            Stop chasing students for spreadsheets. Every portfolio, its
            strength and its gaps — live, in one place, with the analytics your
            board actually asks for.
          </p>
          <ul style={{ marginTop: 20, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
            {[
              'Roster with attention flags: no GPA, no essay, weak leadership',
              'Cohort analytics: strength bands, common gaps, engagement, CSV',
              'Comments students see right inside their builder',
              'Deadline radar across every student’s tracked competitions',
              'White-label: your brand on portfolios and PDFs',
              'Every connected student gets full Pro automatically',
            ].map((t) => (
              <li key={t} style={{ display: 'flex', gap: 10, fontSize: 15 }}>
                <span style={{ color: 'var(--good)', fontWeight: 700 }}>✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <Link href="/start?type=business" className="btn btn-primary">
              Set up my workspace
            </Link>
            <Link href="/upgrade?plan=business" className="btn btn-ghost">
              Business pricing →
            </Link>
          </div>
        </Reveal>
      </div>
      <style>{`
        .schools-grid{display:grid; grid-template-columns:minmax(0,0.95fr) minmax(0,1.05fr); gap:52px; align-items:center;}
        @media (max-width:880px){
          .schools-grid{grid-template-columns:1fr; gap:32px;}
          .schools-grid > *:first-child{order:2;}
        }
      `}</style>
    </section>
  );
}

/* ============================== PRICING ============================== */

function Pricing() {
  return (
    <section className="section" id="pricing" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="wrap">
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <span className="eyebrow">Pricing</span>
            <h2 style={{ fontSize: 'clamp(28px,3.8vw,42px)', marginTop: 14 }}>
              Start free. Upgrade when it earns it.
            </h2>
            <p className="muted" style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.6 }}>
              The builder, honest odds and AI review are free — no card, no
              trial clock. Pay only for depth: the personal AI counselor, the
              essay coach, and the workspace schools run cohorts on.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <PricingCards />
        </Reveal>
        <Reveal delay={200}>
          <p className="muted" style={{ textAlign: 'center', marginTop: 26, fontSize: 13.5 }}>
            Secure checkout by Stripe · cancel anytime · school pilots & local
            payment methods:{' '}
            <a href="mailto:hello@folio.app" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              hello@folio.app
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================ FAQ ================================ */

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
      'You create a workspace, students join with your code, and you see the whole cohort: strength, gaps, attention flags, analytics and a deadline radar. Business covers 20 students, Business Plus covers 75 — and every connected student gets full Pro.',
    ],
    [
      'How do payments and cancellation work?',
      'Checkout runs on Stripe and your plan activates automatically within a minute of payment. You can switch plans, update the card, download invoices or cancel anytime in the billing portal. In Kazakhstan and the CIS we also accept Kaspi — write to hello@folio.app.',
    ],
  ];
  return (
    <section className="section" id="faq">
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

/* ================================ CTA ================================ */

function CTA() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <Reveal>
          <div
            className="card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: 'clamp(44px, 7vw, 72px) clamp(20px, 5vw, 40px)',
              textAlign: 'center',
              background: 'var(--ink)',
              border: 'none',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background:
                  'radial-gradient(600px 300px at 50% -10%, rgba(69,133,217,0.35), transparent 65%), radial-gradient(500px 280px at 85% 110%, rgba(192,138,45,0.25), transparent 60%)',
              }}
            />
            <h2 style={{ position: 'relative', color: '#fff', fontSize: 'clamp(30px,4.4vw,50px)', maxWidth: 680, marginInline: 'auto', letterSpacing: '-0.02em' }}>
              Your application is a story.
              <br />
              Make it a strong one.
            </h2>
            <p style={{ position: 'relative', marginTop: 16, fontSize: 17, color: 'rgba(255,255,255,0.75)' }}>
              Start free — first honest results in about ten minutes.
            </p>
            <div style={{ position: 'relative', display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
              <Link href="/start" className="btn btn-gold" style={{ padding: '14px 30px', fontSize: 16 }}>
                Build my portfolio
              </Link>
              <Link
                href="/start?type=business"
                className="btn"
                style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff', padding: '14px 26px', fontSize: 16 }}
              >
                For schools & counselors
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* =============================== FOOTER =============================== */

function Footer() {
  const cols = [
    {
      title: 'Product',
      links: [
        ['Start free', '/start'],
        ['What Folio does', '/#product'],
        ['Pricing', '/#pricing'],
        ['FAQ', '/#faq'],
      ],
    },
    {
      title: 'For schools',
      links: [
        ['Set up a workspace', '/start?type=business'],
        ['Business pricing', '/upgrade?plan=business'],
        ['Workspace sign-in', '/business'],
      ],
    },
    {
      title: 'Account',
      links: [
        ['Sign in', '/login'],
        ['My portfolio', '/portfolio'],
        ['Upgrade', '/upgrade'],
      ],
    },
  ];
  return (
    <footer style={{ borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
      <div className="wrap footer-grid" style={{ padding: '46px 24px 20px' }}>
        <div>
          <span style={{ fontFamily: 'var(--display)', fontSize: 21, fontWeight: 600 }}>Folio</span>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.6, maxWidth: 260 }}>
            Honest admissions intelligence for students applying abroad — and
            the schools and counselors who guide them.
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
