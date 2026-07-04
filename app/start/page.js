'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/lib/store';
import { track } from '@/lib/analytics';

// First-run onboarding survey. Collects the essentials, pre-fills the portfolio,
// then drops the student into the builder with a head start.

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

export default function StartPage() {
  const router = useRouter();
  const [, update, ready] = usePortfolio();
  const [step, setStep] = useState(0);

  useEffect(() => {
    track('onboarding_start');
  }, []);

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
      title: 'Welcome to Folio',
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
    <div className="wrap" style={{ maxWidth: 600, padding: '40px 24px 80px' }}>
      {/* progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 30 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 999, background: i <= step ? 'var(--primary)' : 'var(--line)', transition: 'background .3s' }} />
        ))}
      </div>

      <div key={step} className="fade-in">
        <span className="eyebrow">Step {step + 1} of {STEPS.length}</span>
        <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', marginTop: 12 }}>{current.title}</h1>
        <p className="muted" style={{ marginTop: 10, fontSize: 16 }}>{current.sub}</p>

        <div className="card card-pad" style={{ marginTop: 24 }}>{current.body}</div>
      </div>

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
      </p>
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
        <span style={{ width: 20, height: 20, borderRadius: 999, border: `2px solid ${active ? 'var(--primary)' : 'var(--line-strong)'}`, background: active ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
          {active ? '✓' : ''}
        </span>
      </span>
    </button>
  );
}
