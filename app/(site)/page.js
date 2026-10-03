import Link from 'next/link';
import PricingCards from '@/components/Pricing';
import Icon from '@/components/Icon';
import { Reveal } from '@/components/Motion';
import {
  HeroVisual,
  BuildVisual,
  FeedbackVisual,
  PlanVisual,
  ApplyVisual,
  ProgressVisual,
  SchoolVisual,
  LV_CSS,
} from '@/components/LandingVisuals';
import { getT } from '@/lib/i18n-server';

// Landing — server component. Two audiences, one page: students (→ /start)
// and schools/counselors (→ /start?type=business). Anchors: #product,
// #schools, #pricing, #faq.

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: { absolute: t('Folio — build your portfolio, get feedback, get in') },
    description: t(
      'Folio turns your grades, tests, activities and essays into one admissions portfolio, gives personal feedback on every part, builds a daily plan and shows your chances at 800+ universities.'
    ),
    alternates: { canonical: '/' },
  };
}

export default async function Landing() {
  const { t } = await getT();
  return (
    <>
      <Hero t={t} />
      <Steps t={t} />
      <Product t={t} />
      <Schools t={t} />
      <section className="section lp-band" id="pricing">
        <div className="wrap">
          <div className="lp-head lp-center">
            <p className="lp-kicker">{t('Pricing')}</p>
            <h2>{t('Start free. Go further with Pro.')}</h2>
            <p>{t('Pro adds the essay coach and the AI counselor.')}</p>
          </div>
          <PricingCards />
        </div>
      </section>
      <FAQ t={t} />
      <FinalCta t={t} />
      <style>{CSS}</style>
      <style>{LV_CSS}</style>
    </>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero({ t }) {
  return (
    <section className="lp-hero">
      <div className="lp-hero-bg" aria-hidden />
      <div className="wrap lp-hero-grid">
        <div className="stagger">
          <p className="lp-kicker">{t('Your path to a top university')}</p>
          <h1 className="lp-h1">
            {t('Build your portfolio.')} <span className="lp-grad">{t('Get in.')}</span>
          </h1>
          <p className="lp-lead">
            {t('Collect everything that makes you a strong applicant in one place, get personal feedback on every part, follow a plan made for you — and apply knowing your chances.')}
          </p>
          <div className="lp-ctas">
            <Link href="/start" className="btn btn-primary lp-cta-main">
              {t('Start for free')} <span aria-hidden>→</span>
            </Link>
          </div>
          <p className="lp-for-schools">
            {t('School or counselor?')}{' '}
            <Link href="/start?type=business">{t('Create a workspace')} <span aria-hidden>→</span></Link>
          </p>
          <div className="lp-steps-mini">
            {[t('Build'), t('Get feedback'), t('Follow the plan'), t('Apply')].map((x, i) => (
              <span key={x}>
                <i>{i + 1}</i> {x}
              </span>
            ))}
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- steps */

function Steps({ t }) {
  const steps = [
    {
      n: '01',
      tag: t('Build'),
      title: t('Everything that makes you stand out, in one portfolio'),
      body: t('Grades, tests, activities and essays — in Common App order.'),
      visual: <BuildVisual />,
    },
    {
      n: '02',
      tag: t('Get feedback'),
      title: t('Personal feedback on every part'),
      body: t('A grade for every activity and a concrete way to improve it.'),
      visual: <FeedbackVisual />,
    },
    {
      n: '03',
      tag: t('Follow the plan'),
      title: t('A plan that moves you forward every day'),
      body: t('Three small tasks a day, picked from your weakest spots.'),
      visual: <PlanVisual />,
    },
    {
      n: '04',
      tag: t('Apply'),
      title: t('Apply with a list you can trust'),
      body: t('Your chances at 800+ universities — from Top 20 to safeties.'),
      visual: <ApplyVisual />,
    },
  ];
  return (
    <section className="section" id="product">
      <div className="wrap">
        <div className="lp-head lp-center">
          <p className="lp-kicker">{t('How it works')}</p>
          <h2>{t('From first draft to acceptance letter')}</h2>
          <p>{t('Four steps, one portfolio.')}</p>
        </div>
        <div className="lp-steps">
          {steps.map((s, i) => (
            <div key={s.n} className={`lp-step${i % 2 ? ' flip' : ''}`}>
              <Reveal className="lp-step-copy">
                <span className="lp-step-n">
                  {s.n} · {s.tag}
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </Reveal>
              <div className="lp-step-visual">{s.visual}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Product({ t }) {
  const features = [
    [t('Profile score'), t('Scored part by part.')],
    [t('University chances'), t('800+ schools, real admission data.')],
    [t('Opportunities'), t('Olympiads, programs, scholarships.')],
    [t('Essay coach'), t('Edits for your personal statement.')],
    [t('AI counselor'), t('Strategy advice in your language.')],
    [t('Deadlines'), t('Every deadline in one countdown.')],
  ];
  return (
    <section className="section lp-band">
      <div className="wrap lp-prog">
        <div>
          <p className="lp-kicker">{t('Progress')}</p>
          <h2 className="lp-h2">{t('Watch your profile grow')}</h2>
          <p className="lp-lead" style={{ fontSize: 16.5 }}>
            {t('Track your growth and compare it with the ideal portfolio for your schools.')}
          </p>
          <Reveal className="lp-feats">
            {features.map(([title, body]) => (
              <div key={title} className="lp-feat">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </Reveal>
        </div>
        <ProgressVisual />
      </div>
    </section>
  );
}

function Schools({ t }) {
  const points = [
    t('Add students by email or code'),
    t('Split the cohort between counselors'),
    t('Cohort analytics'),
    t('Every connected student gets Pro'),
  ];
  return (
    <section className="section" id="schools">
      <div className="wrap lp-schools">
        <div>
          <p className="lp-kicker">{t('For schools and counselors')}</p>
          <h2 className="lp-h2">{t('Lead the whole cohort from one workspace')}</h2>
          <p className="lp-lead" style={{ fontSize: 16.5 }}>
            {t('See who is growing, who went quiet and what to discuss next.')}
          </p>
          <Reveal as="ul" stagger className="lp-checks">
            {points.map((p) => (
              <li key={p}>
                <Icon name="check" size={17} style={{ color: 'var(--primary)', marginTop: 2 }} />
                <span>{p}</span>
              </li>
            ))}
          </Reveal>
          <div className="lp-ctas">
            <Link href="/start?type=business" className="btn btn-primary">
              {t('Create a workspace')}
            </Link>
            <span className="muted" style={{ fontSize: 14 }}>{t('Try it with 3 students for free')}</span>
          </div>
        </div>
        <SchoolVisual />
      </div>
    </section>
  );
}

function FAQ({ t }) {
  const qa = [
    [t('Is Folio really free?'), t('Yes. The portfolio, feedback, the daily plan, university chances and the opportunities database are free. Pro adds the essay coach, the AI counselor and clean exports.')],
    [t('Where do the chances come from?'), t('From each university’s published admission data — acceptance rate, SAT/ACT range and test policy — compared with your profile. They are estimates: use them to build a balanced list, not as a promise.')],
    [t('Does the AI write my application for me?'), t('No. It reviews and suggests. Rewrites use only the facts you gave it, and the essay coach asks questions instead of inventing details.')],
    [t('Who can see my portfolio?'), t('Only you — unless you turn on a public link or connect to your school’s workspace. You can switch either off at any time, and delete everything in Settings.')],
    [t('Which languages are supported?'), t('The interface and AI answers work in English, Russian and Kazakh. Activity rewrites stay in English because applications are submitted in English.')],
    [t('How does the school workspace work?'), t('A counselor creates a workspace, adds students by email or invite code, and sees their portfolios read-only. Students confirm the connection themselves and can disconnect at any time.')],
  ];
  return (
    <section className="section lp-band" id="faq">
      <div className="wrap" style={{ maxWidth: 820 }}>
        <div className="lp-head">
          <h2>{t('Questions')}</h2>
        </div>
        <Reveal stagger className="lp-faq">
          {qa.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta({ t }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="lp-final">
          <h2 className="lp-h2">{t('Your application starts today')}</h2>
          <p className="lp-lead" style={{ marginInline: 'auto' }}>
            {t('Ten minutes — and your score, plan and chances are ready.')}
          </p>
          <div className="lp-ctas" style={{ justifyContent: 'center' }}>
            <Link href="/start" className="btn lp-cta-light">
              {t('Start for free')} <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const CSS = `
.lp-hero{position:relative; padding:84px 0 88px; border-bottom:1px solid var(--line); overflow:hidden;}
.lp-hero-bg{position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(60% 50% at 85% 20%, rgba(69,133,217,.14), transparent 70%),
    radial-gradient(40% 40% at 10% 90%, rgba(69,133,217,.07), transparent 70%);
}
.lp-hero-bg::after{content:''; position:absolute; inset:0;
  background-image:linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size:56px 56px; opacity:.35;
  -webkit-mask-image:radial-gradient(70% 60% at 60% 40%, #000, transparent 75%); mask-image:radial-gradient(70% 60% at 60% 40%, #000, transparent 75%);}
.lp-hero-grid{position:relative; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:64px; align-items:center;}
.lp-h1{font-size:clamp(38px,5.6vw,66px); line-height:1.04; margin-top:16px; letter-spacing:-0.02em;}
.lp-grad{background:linear-gradient(100deg, var(--primary) 10%, #7aa9ea 50%, var(--primary-600) 90%); background-size:200% auto;
  -webkit-background-clip:text; background-clip:text; color:transparent; animation:lpShine 6s ease-in-out infinite;}
@keyframes lpShine{0%,100%{background-position:0% center;} 50%{background-position:100% center;}}
.lp-h2{font-size:clamp(28px,3.8vw,44px); margin-top:12px; letter-spacing:-0.015em;}
.lp-lead{font-size:clamp(16px,1.8vw,19px); line-height:1.6; color:var(--ink-2); margin-top:20px; max-width:560px;}
.lp-ctas{display:flex; gap:12px; margin-top:30px; flex-wrap:wrap; align-items:center;}
.lp-ctas .btn{min-height:50px; padding:12px 24px; font-size:15.5px;}
.lp-cta-main{box-shadow:0 12px 28px -12px rgba(69,133,217,.7);}
.lp-cta-main span{transition:transform .3s var(--ease-spring);}
.lp-cta-main:hover span,.lp-cta-light:hover span{transform:translateX(3px);}
.lp-steps-mini{display:flex; flex-wrap:wrap; gap:8px 18px; margin-top:30px; font-size:13.5px; color:var(--muted); font-weight:600;}
.lp-steps-mini span{display:inline-flex; align-items:center; gap:7px;}
.lp-steps-mini i{font-style:normal; width:20px; height:20px; border-radius:999px; background:var(--primary-tint); color:var(--primary-600); font-size:11px; font-weight:800; display:inline-flex; align-items:center; justify-content:center;}

.lp-kicker{font-size:clamp(16px,1.5vw,19px); font-weight:600; color:var(--primary-600); letter-spacing:-0.01em;}
.lp-for-schools{margin-top:18px; font-size:15px; color:var(--muted);}
.lp-for-schools a{color:var(--ink); font-weight:600; text-decoration:underline; text-decoration-color:var(--line); text-underline-offset:4px; transition:text-decoration-color .2s;}
.lp-for-schools a:hover{text-decoration-color:currentColor;}

.lp-band{background:var(--surface-2); border-top:1px solid var(--line); border-bottom:1px solid var(--line);}
.lp-head{max-width:680px; margin-bottom:40px;}
.lp-head.lp-center{text-align:center; margin-inline:auto;}
.lp-head h2{font-size:clamp(28px,3.8vw,44px); margin-top:10px; letter-spacing:-0.015em;}
.lp-head p:not(.lp-kicker){font-size:16.5px; color:var(--ink-2); margin-top:14px; line-height:1.6;}

.lp-steps{display:grid; gap:96px; margin-top:64px;}
.lp-step{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:72px; align-items:center;}
.lp-step.flip .lp-step-copy{order:2;}
.lp-step-n{font-size:13px; font-weight:700; color:var(--primary-600); letter-spacing:.02em;}
.lp-step h3{font-size:clamp(22px,2.6vw,30px); margin-top:12px; line-height:1.2; letter-spacing:-0.01em;}
.lp-step p{font-size:16px; color:var(--ink-2); line-height:1.65; margin-top:14px; max-width:480px;}
.lp-step-visual{max-width:470px; width:100%; justify-self:center;}

.lp-prog{display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,0.95fr); gap:64px; align-items:center;}
.lp-feats{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:22px 28px; margin-top:32px;}
.lp-feat{border-top:1px solid var(--line); padding-top:14px;}
.lp-feat h3{font-size:15px;}
.lp-feat p{font-size:13.5px; color:var(--muted); line-height:1.5; margin-top:3px;}

.lp-schools{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:64px; align-items:center;}
.lp-checks{list-style:none; margin:24px 0 0; padding:0; display:grid; gap:12px;}
.lp-checks li{display:flex; gap:10px; font-size:15.5px; line-height:1.5;}

.lp-faq{border-top:1px solid var(--line);}
.lp-faq details{border-bottom:1px solid var(--line); padding:4px 0;}
.lp-faq summary{cursor:pointer; list-style:none; font-weight:600; font-size:16.5px; padding:16px 32px 16px 0; position:relative; transition:color .2s ease;}
.lp-faq summary:hover{color:var(--primary-600);}
.lp-faq summary::-webkit-details-marker{display:none;}
.lp-faq summary::after{content:'+'; position:absolute; right:4px; top:12px; font-size:22px; color:var(--muted); font-weight:400; transition:transform .3s var(--ease);}
.lp-faq details[open] summary::after{transform:rotate(45deg);}
.lp-faq details[open] p{animation:rise .4s var(--ease) both;}
.lp-faq p{font-size:15.5px; color:var(--ink-2); line-height:1.65; padding:0 0 18px;}

.lp-final{position:relative; overflow:hidden; text-align:center; padding:64px 28px; border-radius:24px; color:#fff;
  background:radial-gradient(80% 120% at 80% 0%, #6aa2ec 0%, var(--primary) 40%, #2f5fa8 100%);
  box-shadow:0 30px 60px -30px rgba(52,112,193,.7);}
.lp-final::before{content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
  background-size:40px 40px; -webkit-mask-image:radial-gradient(60% 80% at 50% 0%, #000, transparent); mask-image:radial-gradient(60% 80% at 50% 0%, #000, transparent);}
.lp-final > *{position:relative;}
.lp-final .lp-lead{color:rgba(255,255,255,.85); max-width:520px;}
.lp-cta-light{background:#fff; color:var(--primary-600); font-weight:700; box-shadow:0 10px 24px -12px rgba(0,0,0,.4);}
.lp-cta-light:hover{background:#f3f7fd; transform:translateY(-1px);}
.lp-cta-light span{transition:transform .3s var(--ease-spring);}

@media (max-width:900px){
  .lp-hero{padding:48px 0 56px;}
  .lp-hero-grid,.lp-schools,.lp-prog,.lp-step{grid-template-columns:minmax(0,1fr); gap:36px;}
  .lp-step.flip .lp-step-copy{order:0;}
  .lp-steps{gap:64px; margin-top:40px;}
  .lp-step-visual{max-width:none;}
}
@media (max-width:560px){
  .lp-feats{grid-template-columns:minmax(0,1fr);}
  .lp-ctas .btn{width:100%;}
  .lp-final{padding:44px 20px; border-radius:18px;}
}
@media (prefers-reduced-motion: reduce){ .lp-grad{animation:none;} }
`;
