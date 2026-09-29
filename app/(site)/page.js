import Link from 'next/link';
import PricingCards from '@/components/Pricing';
import Icon from '@/components/Icon';
import { UNIVERSITIES } from '@/lib/universities';
import { COMPETITIONS } from '@/lib/competitions';
import { getT } from '@/lib/i18n-server';

// Landing — server component. Two audiences, one page: students (→ /start)
// and schools/counselors (→ /start?type=business). Anchors: #product,
// #schools, #pricing, #faq.

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: { absolute: t('Folio — admissions portfolio, honest AI review and real chances') },
    description: t(
      'Build a Common App–style portfolio, get an honest AI review of every activity, see realistic admission odds for 100+ universities, and find olympiads and programs worth your time.'
    ),
    alternates: { canonical: '/' },
  };
}

export default async function Landing() {
  const { t } = await getT();
  return (
    <>
      <Hero t={t} />
      <Facts t={t} />
      <Grading t={t} />
      <Product t={t} />
      <Schools t={t} />
      <section className="section lp-band" id="pricing">
        <div className="wrap">
          <div className="lp-head">
            <h2>{t('Pricing')}</h2>
            <p>{t('The builder, the assessment and your admission odds are free. Pay only for the deeper AI tools or a school workspace.')}</p>
          </div>
          <PricingCards />
        </div>
      </section>
      <FAQ t={t} />
      <FinalCta t={t} />
      <style>{CSS}</style>
    </>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero({ t }) {
  return (
    <section className="lp-hero">
      <div className="wrap lp-hero-grid">
        <div>
          <p className="eyebrow">{t('For students applying to universities abroad')}</p>
          <h1 className="lp-h1">{t('Know exactly where you stand. Then close the gap.')}</h1>
          <p className="lp-lead">
            {t('Folio turns your grades, tests, activities and awards into a Common App–style portfolio, grades each part the way an admissions reader would, and shows your real odds at 100+ universities.')}
          </p>
          <div className="lp-ctas">
            <Link href="/start" className="btn btn-primary">
              {t('Build my portfolio — free')}
            </Link>
            <Link href="/start?type=business" className="btn btn-ghost">
              {t('I am a school or counselor')}
            </Link>
          </div>
          <p className="lp-small">{t('No card needed · English, Russian and Kazakh')}</p>
        </div>

        <div className="lp-panel" aria-hidden>
          <div className="lp-panel-head">
            <span>{t('Assessment')}</span>
            <span className="muted">Aisha K. · 11</span>
          </div>
          <div className="lp-panel-body">
            <div className="lp-row">
              <span className="pill band-target">{t('Tier {n}', { n: 2 })}</span>
              <span className="lp-row-main">
                <b>{t('Founder, coding club for rural schools')}</b>
                <small>{t('400 students reached · 3 years · national reach')}</small>
              </span>
              <span className="lp-score">82</span>
            </div>
            <div className="lp-row">
              <span className="pill band-hard-reach">{t('Tier {n}', { n: 4 })}</span>
              <span className="lp-row-main">
                <b>{t('Member, chess club')}</b>
                <small>{t('No leadership or results described')}</small>
              </span>
              <span className="lp-score">6</span>
            </div>
            <div className="lp-divider" />
            {[
              ['MIT', 4.1, 'band-hard-reach'],
              ['University of Toronto', 38, 'band-target'],
              ['University of Michigan', 21, 'band-reach'],
            ].map(([n, v, band]) => (
              <div className="lp-odds" key={n}>
                <span>{n}</span>
                <span className="lp-bar">
                  <span className={band} style={{ width: `${Math.max(4, v)}%` }} />
                </span>
                <b>{v}%</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Facts({ t }) {
  const items = [
    [`${UNIVERSITIES.length}+`, t('universities with real acceptance data')],
    [`${COMPETITIONS.length}+`, t('olympiads, programs and scholarships')],
    ['3', t('languages: English, Russian, Kazakh')],
    ['0 ₸', t('to build and assess your portfolio')],
  ];
  return (
    <div className="lp-facts">
      <div className="wrap lp-facts-grid">
        {items.map(([n, label]) => (
          <div key={label}>
            <div className="lp-fact-n">{n}</div>
            <div className="lp-fact-l">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- grading */

function Grading({ t }) {
  const cols = [
    {
      title: t('Every activity is graded, not counted'),
      body: t('Role, reach, measurable results and hours decide the tier. “Member of a club” and “founded a project that reached 400 students” land in different places — ten weak activities do not beat three strong ones.'),
    },
    {
      title: t('Test scores count at their real weight'),
      body: t('A 1550 SAT is around the 99th percentile; a 1200 is around the 75th. Folio scores them that far apart, and compares them to each university’s admitted range.'),
    },
    {
      title: t('Odds against each school’s admitted class'),
      body: t('Each estimate starts from the school’s real acceptance rate and shows its reasoning. The most selective schools are capped, because past a point admission is unpredictable.'),
    },
  ];
  return (
    <section className="section" id="product">
      <div className="wrap">
        <div className="lp-head">
          <h2>{t('An honest assessment, not a pep talk')}</h2>
          <p>{t('Most tools tell every student they are doing great. Folio tells you what an admissions reader would see — and what would change it.')}</p>
        </div>
        <div className="lp-cols">
          {cols.map((c, i) => (
            <div key={c.title} className="lp-col">
              <span className="lp-num">0{i + 1}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Product({ t }) {
  const features = [
    ['portfolio', t('Portfolio builder'), t('Academics, tests, up to 10 activities and 5 honors, in the order the Common App asks for them.')],
    ['gauge', t('Assessment'), t('Profile strength, a tier for every activity, and an AI review with specific next steps.')],
    ['university', t('Universities'), t('Your odds at 100+ schools in the US, UK and Canada, with the reasoning behind each number.')],
    ['compass', t('Opportunities'), t('Olympiads, research programs and scholarships matched to your profile, with deadlines.')],
    ['pen', t('Essay coach'), t('Structure, show-don’t-tell and line edits for your personal statement. It never invents facts.')],
    ['chat', t('AI counselor'), t('Ask strategy questions about your own profile: school list, summer plans, early decision.')],
    ['calendar', t('Deadlines'), t('Application rounds for your list and tracked programs in one countdown.')],
    ['share', t('Share & PDF'), t('A public page you control and a clean PDF for counselors and scholarship committees.')],
  ];
  return (
    <section className="section lp-band">
      <div className="wrap">
        <div className="lp-head">
          <h2>{t('Everything in one place')}</h2>
          <p>{t('Eight tools that share one portfolio — change something once and every part updates.')}</p>
        </div>
        <div className="lp-feats">
          {features.map(([icon, title, body]) => (
            <div key={title} className="lp-feat">
              <Icon name={icon} size={20} style={{ color: 'var(--primary-600)' }} />
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Schools({ t }) {
  const points = [
    t('Add students by email or with one invite code'),
    t('See every portfolio, its strength and its gaps on one roster'),
    t('Leave comments students see right in their portfolio'),
    t('Cohort analytics and CSV export for parents’ meetings'),
    t('Your school’s name on shared portfolios and PDFs'),
    t('Every connected student gets Pro'),
  ];
  return (
    <section className="section" id="schools">
      <div className="wrap lp-schools">
        <div>
          <p className="eyebrow">{t('For schools and counselors')}</p>
          <h2 className="lp-h2">{t('Follow the whole cohort without chasing spreadsheets')}</h2>
          <p className="lp-lead" style={{ fontSize: 16.5 }}>
            {t('A workspace for school counselors and admissions consultants. Students keep building their own portfolios; you see progress, gaps and deadlines in one place.')}
          </p>
          <div className="lp-ctas">
            <Link href="/start?type=business" className="btn btn-primary">
              {t('Create a workspace')}
            </Link>
            <span className="muted" style={{ fontSize: 14 }}>{t('Try it with 3 students for free')}</span>
          </div>
        </div>
        <ul className="lp-checks">
          {points.map((p) => (
            <li key={p}>
              <Icon name="check" size={18} style={{ color: 'var(--good)', marginTop: 2 }} />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FAQ({ t }) {
  const qa = [
    [t('Is Folio really free?'), t('Yes. The portfolio builder, the assessment, admission odds, the opportunities database and a daily AI review are free. Pro adds the essay coach, the AI counselor and clean exports.')],
    [t('How accurate are the admission odds?'), t('They are estimates built from each university’s published acceptance rate and test ranges, compared with your profile. They are honest about uncertainty — use them to build a balanced list, not as a promise.')],
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
        <div className="lp-faq">
          {qa.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ t }) {
  return (
    <section className="section">
      <div className="wrap lp-final">
        <h2 className="lp-h2">{t('Start with where you are today')}</h2>
        <p className="lp-lead" style={{ marginInline: 'auto' }}>
          {t('Ten minutes to fill in the basics, and you will see your assessment and your odds.')}
        </p>
        <div className="lp-ctas" style={{ justifyContent: 'center' }}>
          <Link href="/start" className="btn btn-primary">
            {t('Build my portfolio — free')}
          </Link>
        </div>
      </div>
    </section>
  );
}

const CSS = `
.lp-hero{padding:72px 0 64px; border-bottom:1px solid var(--line);}
.lp-hero-grid{display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,0.9fr); gap:56px; align-items:center;}
.lp-h1{font-size:clamp(34px,5vw,56px); line-height:1.08; margin-top:14px; letter-spacing:-0.01em;}
.lp-h2{font-size:clamp(28px,3.6vw,40px); margin-top:12px;}
.lp-lead{font-size:clamp(16px,1.8vw,18.5px); line-height:1.6; color:var(--ink-2); margin-top:18px; max-width:600px;}
.lp-ctas{display:flex; gap:12px; margin-top:28px; flex-wrap:wrap; align-items:center;}
.lp-ctas .btn{min-height:48px; padding:12px 22px; font-size:15.5px;}
.lp-small{margin-top:14px; font-size:13.5px; color:var(--faint);}

.lp-panel{background:var(--surface); border:1px solid var(--line-strong); border-radius:var(--r-lg); overflow:hidden;}
.lp-panel-head{display:flex; justify-content:space-between; padding:12px 18px; border-bottom:1px solid var(--line); font-size:13.5px; font-weight:600; background:var(--surface-2);}
.lp-panel-body{padding:8px 18px 18px;}
.lp-row{display:flex; gap:12px; align-items:center; padding:12px 0; border-bottom:1px solid var(--line);}
.lp-row-main{flex:1; min-width:0; display:grid;}
.lp-row-main b{font-size:14px; font-weight:600;}
.lp-row-main small{font-size:12.5px; color:var(--muted);}
.lp-score{font-family:var(--display); font-size:18px;}
.lp-divider{height:6px;}
.lp-odds{display:grid; grid-template-columns:minmax(0,150px) 1fr 46px; gap:12px; align-items:center; font-size:13.5px; margin-top:12px;}
.lp-odds span:first-child{white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
.lp-odds b{text-align:right;}
.lp-bar{height:6px; background:var(--line); border-radius:999px; overflow:hidden;}
.lp-bar span{display:block; height:100%; border-radius:999px;}
.lp-bar .band-hard-reach{background:var(--bad);} .lp-bar .band-reach{background:var(--warn);} .lp-bar .band-target{background:var(--primary);}

.lp-facts{border-bottom:1px solid var(--line); background:var(--surface);}
.lp-facts-grid{display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:24px; padding-top:26px; padding-bottom:26px;}
.lp-fact-n{font-family:var(--display); font-size:28px;}
.lp-fact-l{font-size:13.5px; color:var(--muted); margin-top:2px; line-height:1.4;}

.lp-band{background:var(--surface-2); border-top:1px solid var(--line); border-bottom:1px solid var(--line);}
.lp-head{max-width:680px; margin-bottom:36px;}
.lp-head h2{font-size:clamp(28px,3.6vw,40px);}
.lp-head p{font-size:16.5px; color:var(--ink-2); margin-top:12px; line-height:1.6;}
.lp-cols{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:32px;}
.lp-col{border-top:2px solid var(--ink); padding-top:18px;}
.lp-num{font-size:13px; font-weight:700; color:var(--faint);}
.lp-col h3{font-size:18.5px; margin-top:8px;}
.lp-col p{font-size:15px; color:var(--ink-2); line-height:1.6; margin-top:10px;}

.lp-feats{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0; border-top:1px solid var(--line);}
.lp-feat{display:flex; gap:14px; padding:20px 4px; border-bottom:1px solid var(--line);}
.lp-feat:nth-child(odd){padding-right:28px;}
.lp-feat h3{font-size:16px;}
.lp-feat p{font-size:14.5px; color:var(--muted); line-height:1.55; margin-top:4px;}

.lp-schools{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:56px; align-items:center;}
.lp-checks{list-style:none; margin:0; padding:24px; display:grid; gap:14px; background:var(--surface); border:1px solid var(--line); border-radius:var(--r-lg);}
.lp-checks li{display:flex; gap:12px; font-size:15.5px; line-height:1.5;}

.lp-faq{border-top:1px solid var(--line);}
.lp-faq details{border-bottom:1px solid var(--line); padding:4px 0;}
.lp-faq summary{cursor:pointer; list-style:none; font-weight:600; font-size:16.5px; padding:16px 32px 16px 0; position:relative;}
.lp-faq summary::-webkit-details-marker{display:none;}
.lp-faq summary::after{content:'+'; position:absolute; right:4px; top:12px; font-size:22px; color:var(--muted); font-weight:400;}
.lp-faq details[open] summary::after{content:'–';}
.lp-faq p{font-size:15.5px; color:var(--ink-2); line-height:1.65; padding:0 0 18px;}

.lp-final{text-align:center; max-width:680px;}

@media (max-width:900px){
  .lp-hero{padding:44px 0 44px;}
  .lp-hero-grid,.lp-schools{grid-template-columns:minmax(0,1fr); gap:36px;}
  .lp-cols{grid-template-columns:minmax(0,1fr); gap:26px;}
  .lp-feats{grid-template-columns:minmax(0,1fr);}
  .lp-feat:nth-child(odd){padding-right:4px;}
  .lp-facts-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:480px){
  .lp-ctas .btn{width:100%;}
  .lp-odds{grid-template-columns:minmax(0,110px) 1fr 42px;}
}
`;
