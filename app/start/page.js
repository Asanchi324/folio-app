'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/lib/store';
import { useAccount } from '@/lib/account';
import { createOrg } from '@/lib/org';
import { signInWithGoogle } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { track } from '@/lib/analytics';

// First-run onboarding. Forks by audience on step 0:
//   student → the portfolio survey (pre-fills the builder), then /portfolio
//   business (school / counselor) → a short workspace survey, Google sign-in,
//   workspace created → /business (the Business Workspace). Deep-linkable:
//   /start?type=business.

const GRADES = [
  { v: '9', label: 'Grade 9', note: 'Lots of runway' },
  { v: '10', label: 'Grade 10', note: 'Time to build a spike' },
  { v: '11', label: 'Grade 11', note: 'The pivotal year' },
  { v: '12', label: 'Grade 12', note: 'Applying now' },
  { v: 'gap', label: 'Gap year', note: '' },
];

const TARGETS = ['USA', 'UK', 'Canada', 'Europe', 'Asia'];

const HAVE_TESTS = [
  { v: 'yes', label: 'Yes, I have scores' },
  { v: 'studying', label: 'Studying / planning to' },
  { v: 'no', label: 'Not yet' },
];

const EC_LEVELS = [
  { v: 'lots', label: 'Lots — clubs, projects, leadership' },
  { v: 'some', label: 'A few activities' },
  { v: 'little', label: 'Not much yet' },
];

const ORG_SIZES = [
  { v: '1-5', label: '1–5 students', note: 'Private practice' },
  { v: '6-20', label: '6–20 students', note: 'A cohort' },
  { v: '21-100', label: '21–100 students', note: 'A school year' },
  { v: '100+', label: '100+ students', note: 'Whole school' },
];

const ORG_GOALS = [
  ['progress', 'See every student’s progress & gaps in one place'],
  ['comments', 'Leave feedback students actually read'],
  ['ai', 'AI review & essay coaching for my students'],
  ['brand', 'Portfolios & PDFs under my brand'],
];

export default function StartPage() {
  const router = useRouter();

  // Audience fork. null = ask first.
  const [audience, setAudience] = useState(null);
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('type');
    if (t === 'business' || t === 'student') setAudience(t);
    track('onboarding_start', { type: t || 'ask' });
  }, []);

  if (!audience) {
    return (
      <Frame step={0} total={4} eyebrow="Getting started" title="Welcome to Folio" sub="First things first — who is this for?">
        <div style={{ display: 'grid', gap: 12 }}>
          <BigChoice
            icon="🎓"
            title="I’m a student"
            note="Build my portfolio, see my real chances, get honest AI feedback."
            onClick={() => { setAudience('student'); track('onboarding_audience', { type: 'student' }); }}
          />
          <BigChoice
            icon="🏛"
            title="I’m a school or counselor"
            note="Track my students’ portfolios, progress and gaps in one dashboard."
            onClick={() => { setAudience('business'); track('onboarding_audience', { type: 'business' }); }}
          />
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 18, textAlign: 'center' }}>
          A parent? Pick “student” — you can fill the portfolio in together.
        </p>
      </Frame>
    );
  }

  return audience === 'student' ? (
    <StudentSurvey router={router} onSwitch={() => setAudience('business')} />
  ) : (
    <BusinessSurvey router={router} onSwitch={() => setAudience('student')} />
  );
}

/* ============================ STUDENT ============================ */

function StudentSurvey({ router, onSwitch }) {
  const [, update, ready] = usePortfolio();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    fullName: '',
    gradeLevel: '11',
    country: '',
    targetCountries: ['USA'],
    intendedMajor: '',
    gpa: '',
    gpaScale: '4',
    haveTests: 'studying',
    sat: '',
    ielts: '',
    ecLevel: 'some',
  });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const STEPS = [
    {
      title: 'Nice to meet you',
      sub: 'Two minutes now saves you hours later. Let’s start with the basics.',
      valid: () => form.fullName.trim() && form.gradeLevel,
      body: (
        <>
          <Field label="What’s your name?">
            <input autoFocus value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="Aisha Karimova" />
          </Field>
          <span className="field-label">What grade are you in?</span>
          <div style={{ display: 'grid', gap: 10 }}>
            {GRADES.map((g) => (
              <Choice key={g.v} active={form.gradeLevel === g.v} onClick={() => set({ gradeLevel: g.v })} label={g.label} note={g.note} />
            ))}
          </div>
        </>
      ),
    },
    {
      title: 'Where are you headed?',
      sub: 'This shapes which universities and opportunities we surface for you.',
      valid: () => form.targetCountries.length > 0,
      body: (
        <>
          <Field label="Your home country">
            <input value={form.country} onChange={(e) => set({ country: e.target.value })} placeholder="Kazakhstan" />
          </Field>
          <Field label="Intended major" hint="a guess is fine">
            <input value={form.intendedMajor} onChange={(e) => set({ intendedMajor: e.target.value })} placeholder="Computer Science" />
          </Field>
          <span className="field-label">Where do you want to study?</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {TARGETS.map((t) => {
              const on = form.targetCountries.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set({ targetCountries: on ? form.targetCountries.filter((x) => x !== t) : [...form.targetCountries, t] })}
                  className={`pill ${on ? '' : 'pill-muted'}`}
                  style={{ cursor: 'pointer', border: 'none', fontSize: 14, padding: '9px 16px', background: on ? 'var(--primary)' : undefined, color: on ? '#fff' : undefined }}
                >
                  {on ? '✓ ' : ''}{t}
                </button>
              );
            })}
          </div>
        </>
      ),
    },
    {
      title: 'Where are your grades & tests?',
      sub: 'Rough numbers are fine — you can refine everything later.',
      valid: () => true,
      body: (
        <>
          <div className="row row-2">
            <Field label="GPA" hint="if you know it">
              <input type="number" step="0.01" value={form.gpa} onChange={(e) => set({ gpa: e.target.value })} placeholder="3.9" />
            </Field>
            <Field label="GPA scale">
              <select value={form.gpaScale} onChange={(e) => set({ gpaScale: e.target.value })}>
                <option value="4">out of 4.0</option>
                <option value="5">out of 5.0</option>
                <option value="100">out of 100</option>
              </select>
            </Field>
          </div>
          <span className="field-label">Do you have SAT / IELTS scores?</span>
          <div style={{ display: 'grid', gap: 10, marginBottom: 6 }}>
            {HAVE_TESTS.map((h) => (
              <Choice key={h.v} active={form.haveTests === h.v} onClick={() => set({ haveTests: h.v })} label={h.label} />
            ))}
          </div>
          {form.haveTests === 'yes' && (
            <div className="row row-2 fade-in" style={{ marginTop: 8 }}>
              <Field label="SAT total" hint="optional">
                <input type="number" value={form.sat} onChange={(e) => set({ sat: e.target.value })} placeholder="1480" />
              </Field>
              <Field label="IELTS" hint="optional">
                <input type="number" step="0.5" value={form.ielts} onChange={(e) => set({ ielts: e.target.value })} placeholder="7.5" />
              </Field>
            </div>
          )}
        </>
      ),
    },
    {
      title: 'How active are you outside class?',
      sub: 'Clubs, sports, projects, jobs, volunteering — anything counts.',
      valid: () => true,
      body: (
        <div style={{ display: 'grid', gap: 10 }}>
          {EC_LEVELS.map((e) => (
            <Choice key={e.v} active={form.ecLevel === e.v} onClick={() => set({ ecLevel: e.v })} label={e.label} />
          ))}
        </div>
      ),
    },
  ];

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  function finish() {
    const testing = {};
    if (form.haveTests === 'yes') {
      if (form.sat) testing.sat = form.sat;
      if (form.ielts) testing.ielts = form.ielts;
    }
    update((prev) => ({
      ...prev,
      onboarded: true,
      fullName: form.fullName,
      gradeLevel: form.gradeLevel,
      country: form.country,
      targetCountries: form.targetCountries,
      intendedMajor: form.intendedMajor,
      academics: { ...prev.academics, gpa: form.gpa, gpaScale: form.gpaScale },
      testing: { ...prev.testing, ...testing },
    }));
    track('onboarding_complete', { grade: form.gradeLevel, major: form.intendedMajor || '(none)' });
    router.push('/portfolio');
  }

  return (
    <Frame
      step={step + 1}
      total={STEPS.length + 1}
      title={current.title}
      sub={current.sub}
      footer={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => (step === 0 ? router.push('/') : setStep((s) => s - 1))}>
              ← Back
            </button>
            {!last ? (
              <button className="btn btn-primary" disabled={!current.valid()} onClick={() => setStep((s) => s + 1)}>
                Continue →
              </button>
            ) : (
              <button className="btn btn-primary" disabled={!ready} onClick={finish}>
                Build my portfolio →
              </button>
            )}
          </div>
          <p style={{ textAlign: 'center', marginTop: 22 }}>
            <button
              onClick={() => { update({ onboarded: true }); track('onboarding_complete', { skipped: true }); router.push('/portfolio'); }}
              style={{ background: 'none', border: 'none', color: 'var(--faint)', fontSize: 13.5, cursor: 'pointer', width: 'auto' }}
            >
              Skip — I’ll fill it in myself
            </button>
            {step === 0 && (
              <button
                onClick={onSwitch}
                style={{ background: 'none', border: 'none', color: 'var(--faint)', fontSize: 13.5, cursor: 'pointer', width: 'auto', marginLeft: 16 }}
              >
                I’m a school / counselor →
              </button>
            )}
          </p>
        </>
      }
    >
      {current.body}
    </Frame>
  );
}

/* ============================ BUSINESS ============================ */

function BusinessSurvey({ router, onSwitch }) {
  const { user, ready, profile } = useAccount();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: 'practice',
    size: '6-20',
    goals: ['progress', 'comments'],
  });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const configured = isFirebaseConfigured();

  // Already in a workspace → nothing to onboard.
  if (ready && profile?.orgId) {
    return (
      <Frame step={1} total={1} title="You already have a workspace" sub="Your workspace is ready.">
        <Link href="/business" className="btn btn-primary" style={{ width: '100%' }}>
          Open my workspace →
        </Link>
      </Frame>
    );
  }

  const STEPS = [
    {
      title: 'About your practice',
      sub: 'This names your workspace — students will see it when they connect.',
      valid: () => form.name.trim().length > 1,
      body: (
        <>
          <Field label="Workspace name">
            <input
              autoFocus
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="NIS Almaty · Aida’s Admissions Studio"
            />
          </Field>
          <span className="field-label">What are you?</span>
          <div style={{ display: 'grid', gap: 10 }}>
            <Choice
              active={form.type === 'practice'}
              onClick={() => set({ type: 'practice' })}
              label="Independent counselor / consultancy"
              note="You advise students privately"
            />
            <Choice
              active={form.type === 'school'}
              onClick={() => set({ type: 'school' })}
              label="School"
              note="Counselors + cohorts of students"
            />
          </div>
        </>
      ),
    },
    {
      title: 'How many students?',
      sub: 'You can trial the workflow with 3 students — Business scales to 20, Business Plus to 75.',
      valid: () => true,
      body: (
        <div style={{ display: 'grid', gap: 10 }}>
          {ORG_SIZES.map((s) => (
            <Choice key={s.v} active={form.size === s.v} onClick={() => set({ size: s.v })} label={s.label} note={s.note} />
          ))}
        </div>
      ),
    },
    {
      title: 'What matters most to you?',
      sub: 'Pick any — we’ll point you at the right tools first.',
      valid: () => true,
      body: (
        <div style={{ display: 'grid', gap: 10 }}>
          {ORG_GOALS.map(([v, label]) => {
            const on = form.goals.includes(v);
            return (
              <Choice
                key={v}
                active={on}
                onClick={() => set({ goals: on ? form.goals.filter((x) => x !== v) : [...form.goals, v] })}
                label={label}
              />
            );
          })}
        </div>
      ),
    },
  ];

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  async function finish() {
    setErr('');
    if (!configured) {
      setErr('Accounts aren’t configured on this deployment yet — workspaces need Firebase keys.');
      return;
    }
    setBusy(true);
    try {
      let u = user;
      if (!u) {
        await signInWithGoogle(); // popup path resolves with the user signed in
        // useAccount refreshes async; read the fresh user directly.
        const { getFirebaseAuth } = await import('@/lib/firebase');
        u = getFirebaseAuth()?.currentUser;
        if (!u) throw new Error('Sign-in didn’t complete — try again.');
      }
      await createOrg(form, u);
      track('org_created', { type: form.type, size: form.size, via: 'onboarding' });
      router.push('/business?created=1');
    } catch (e) {
      setErr(e?.message || 'Could not create the workspace.');
      setBusy(false);
    }
  }

  return (
    <Frame
      step={step + 1}
      total={STEPS.length + 1}
      title={current.title}
      sub={current.sub}
      eyebrow="For schools & counselors"
      footer={
        <>
          {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 14, textAlign: 'center' }}>{err}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => (step === 0 ? router.push('/') : setStep((s) => s - 1))}>
              ← Back
            </button>
            {!last ? (
              <button className="btn btn-primary" disabled={!current.valid()} onClick={() => setStep((s) => s + 1)}>
                Continue →
              </button>
            ) : (
              <button className="btn btn-primary" disabled={busy || !ready} onClick={finish}>
                {busy ? 'Creating…' : user ? 'Create my workspace' : 'Sign in & create my workspace'}
              </button>
            )}
          </div>
          <p style={{ textAlign: 'center', marginTop: 22 }}>
            {step === 0 && (
              <button
                onClick={onSwitch}
                style={{ background: 'none', border: 'none', color: 'var(--faint)', fontSize: 13.5, cursor: 'pointer', width: 'auto' }}
              >
                Actually, I’m a student →
              </button>
            )}
          </p>
        </>
      }
    >
      {current.body}
    </Frame>
  );
}

/* ============================ shared UI ============================ */

function Frame({ step, total, title, sub, eyebrow, children, footer }) {
  return (
    <div className="wrap" style={{ maxWidth: 600, padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 30 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 999, background: i < step ? 'var(--primary)' : 'var(--line)', transition: 'background .3s' }} />
        ))}
      </div>

      <div key={`${title}`} className="fade-in">
        <span className="eyebrow">{eyebrow || `Step ${step} of ${total}`}</span>
        <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', marginTop: 12 }}>{title}</h1>
        {sub && <p className="muted" style={{ marginTop: 10, fontSize: 16 }}>{sub}</p>}
        <div className="card card-pad" style={{ marginTop: 24 }}>{children}</div>
      </div>

      {footer}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {hint && <span className="field-hint">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Choice({ active, onClick, label, note }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        textAlign: 'left',
        width: '100%',
        padding: '14px 16px',
        borderRadius: 'var(--r-sm)',
        border: `1.5px solid ${active ? 'var(--primary)' : 'var(--line-strong)'}`,
        background: active ? 'var(--primary-tint)' : 'var(--surface)',
        cursor: 'pointer',
        transition: 'all .15s ease',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: active ? 'var(--primary)' : 'var(--ink)' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {note && <span className="muted" style={{ fontSize: 12.5 }}>{note}</span>}
        <span style={{ width: 20, height: 20, borderRadius: 999, border: `2px solid ${active ? 'var(--primary)' : 'var(--line-strong)'}`, background: active ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, flexShrink: 0 }}>
          {active ? '✓' : ''}
        </span>
      </span>
    </button>
  );
}

function BigChoice({ icon, title, note, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bigchoice"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        textAlign: 'left',
        width: '100%',
        padding: '20px 18px',
        borderRadius: 'var(--r)',
        border: '1.5px solid var(--line-strong)',
        background: 'var(--surface)',
        cursor: 'pointer',
        transition: 'border-color .15s ease, transform .15s ease, box-shadow .15s ease',
      }}
    >
      <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
      <span>
        <span style={{ display: 'block', fontSize: 16.5, fontWeight: 700 }}>{title}</span>
        <span className="muted" style={{ display: 'block', fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>{note}</span>
      </span>
      <span aria-hidden style={{ marginLeft: 'auto', color: 'var(--faint)', fontSize: 18 }}>›</span>
      <style>{`
        .bigchoice:hover{border-color:var(--primary); transform:translateY(-2px); box-shadow:var(--shadow);}
      `}</style>
    </button>
  );
}
