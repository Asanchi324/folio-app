'use client';

// Portfolio builder — the Common App–style form. Scores, the AI review and the
// other tools live on their own pages (sidebar); here each activity and honor
// shows its live grade so the student sees quality, not just a count.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortfolio, newId } from '@/lib/store';
import { profileBreakdown, completeness, gradeActivity, gradeHonor, strengthTier } from '@/lib/profile';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import Ring from '@/components/Ring';
import CommentsCard from '@/components/CommentsCard';
import { Section, Field, Loading, Spinner, TierBadge } from '@/components/ui';
import Icon from '@/components/Icon';

const LEVELS = ['school', 'regional', 'state', 'national', 'international'];
const LEVEL_LABEL = { school: 'School', regional: 'Regional', state: 'State', national: 'National', international: 'International' };

export default function PortfolioPage() {
  const router = useRouter();
  const { t } = useT();
  const [p, update, ready, meta, synced] = usePortfolio();

  // First-time visitors go through onboarding first. Waits for the cloud copy
  // (synced) so a signed-in user on a fresh device isn't bounced while loading.
  useEffect(() => {
    if (ready && synced && !p.onboarded && !p.fullName) router.replace('/start');
  }, [ready, synced, p.onboarded, p.fullName, router]);

  useEffect(() => {
    track('portfolio_view');
  }, []);

  const breakdown = useMemo(() => profileBreakdown(p), [p]);
  const complete = useMemo(() => completeness(p), [p]);

  if (!ready) return <Loading label={t('Loading your portfolio…')} />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{t('Your portfolio')}</h1>
          <p>{t('Fill it in the way the Common App asks. Everything saves automatically.')}</p>
        </div>
      </div>

      <ProgressStrip breakdown={breakdown} complete={complete} />

      <div className="stagger" style={{ display: 'grid', gap: 18, marginTop: 18 }}>
        <CommentsCard meta={meta} />
        <Basics p={p} update={update} />
        <Academics p={p} update={update} />
        <Testing p={p} update={update} />
        <Activities p={p} update={update} />
        <Honors p={p} update={update} />
        <Narrative p={p} update={update} />
      </div>
    </div>
  );
}

function ProgressStrip({ breakdown, complete }) {
  const { t } = useT();
  const s = breakdown.strength;
  const color = s >= 75 ? 'var(--good)' : s >= 50 ? 'var(--primary)' : s >= 30 ? 'var(--warn)' : 'var(--bad)';
  return (
    <div className="card pf-strip">
      <Ring value={s} size={64} stroke={7} color={color} label={s} />
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontWeight: 650 }}>
          {t('Profile strength')}: {t(strengthTier(s))}
        </div>
        <div className="muted" style={{ fontSize: 13.5 }}>
          {t('{n}% complete', { n: complete })} ·{' '}
          {breakdown.pillars.map((pl) => `${t(pl.label)} ${pl.score}`).join(' · ')}
        </div>
      </div>
      <Link href="/review" className="btn btn-ghost btn-sm">
        {t('Full assessment')} <Icon name="arrow" size={15} />
      </Link>
      <style>{`
        .pf-strip{display:flex; align-items:center; gap:16px; padding:14px 18px; flex-wrap:wrap;}
      `}</style>
    </div>
  );
}

/* =========================== sections =========================== */

function Basics({ p, update }) {
  const { t } = useT();
  return (
    <Section title={t('Basics')}>
      <div className="row row-2">
        <Field label={t('Full name')}>
          <input value={p.fullName} onChange={(e) => update({ fullName: e.target.value })} placeholder="Aisha Karimova" maxLength={80} autoComplete="name" />
        </Field>
        <Field label={t('Intended major')} hint={t('be specific')}>
          <input value={p.intendedMajor} onChange={(e) => update({ intendedMajor: e.target.value })} placeholder={t('Computer Science')} maxLength={80} />
        </Field>
      </div>
      <div className="row row-2">
        <Field label={t('Country')}>
          <input value={p.country} onChange={(e) => update({ country: e.target.value })} placeholder={t('Kazakhstan')} maxLength={60} autoComplete="country-name" />
        </Field>
        <Field label={t('Grade / year')}>
          <select value={p.gradeLevel} onChange={(e) => update({ gradeLevel: e.target.value })}>
            {['9', '10', '11', '12'].map((g) => (
              <option key={g} value={g}>
                {t('Grade {n}', { n: g })}
              </option>
            ))}
            <option value="gap">{t('Gap year')}</option>
          </select>
        </Field>
      </div>
    </Section>
  );
}

function Academics({ p, update }) {
  const { t } = useT();
  const a = p.academics;
  const set = (patch) => update({ academics: { ...a, ...patch } });
  return (
    <Section title={t('Academics')}>
      <div className="row row-3">
        <Field label="GPA">
          <input type="number" inputMode="decimal" step="0.01" min="0" value={a.gpa} onChange={(e) => set({ gpa: e.target.value })} placeholder="3.9" />
        </Field>
        <Field label={t('GPA scale')}>
          <select value={a.gpaScale} onChange={(e) => set({ gpaScale: e.target.value })}>
            <option value="4">{t('out of 4.0')}</option>
            <option value="5">{t('out of 5.0')}</option>
            <option value="100">{t('out of 100')}</option>
          </select>
        </Field>
        <Field label={t('Class rank')} hint={t('optional')}>
          <input value={a.classRank} onChange={(e) => set({ classRank: e.target.value })} placeholder="3 / 120" maxLength={20} />
        </Field>
      </div>
      <Field label={t('Course rigor')} hint={t('AP / IB / A-level load')}>
        <input value={a.rigor} onChange={(e) => set({ rigor: e.target.value })} placeholder={t('5 APs, IB Higher Level Math & Physics')} maxLength={200} />
      </Field>
    </Section>
  );
}

function Testing({ p, update }) {
  const { t } = useT();
  const tt = p.testing;
  const set = (patch) => update({ testing: { ...tt, ...patch } });
  const aps = tt.apScores || [];
  return (
    <Section title={t('Testing')}>
      <div className="row row-2">
        <Field label={t('SAT total')} hint="400–1600">
          <input type="number" inputMode="numeric" min="400" max="1600" value={tt.sat} onChange={(e) => set({ sat: e.target.value })} placeholder="1480" />
        </Field>
        <Field label="ACT" hint={t('optional, 1–36')}>
          <input type="number" inputMode="numeric" min="1" max="36" value={tt.act} onChange={(e) => set({ act: e.target.value })} placeholder="33" />
        </Field>
      </div>
      <div className="row row-2">
        <Field label="IELTS" hint="0–9">
          <input type="number" inputMode="decimal" step="0.5" min="0" max="9" value={tt.ielts} onChange={(e) => set({ ielts: e.target.value })} placeholder="7.5" />
        </Field>
        <Field label="TOEFL" hint={t('optional, 0–120')}>
          <input type="number" inputMode="numeric" min="0" max="120" value={tt.toefl} onChange={(e) => set({ toefl: e.target.value })} placeholder="105" />
        </Field>
      </div>

      <span className="field-label">{t('AP / IB exam scores')}</span>
      <div style={{ display: 'grid', gap: 8 }}>
        {aps.map((ap) => (
          <div key={ap.id} style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, minWidth: 0 }}
              value={ap.subject}
              onChange={(e) => set({ apScores: aps.map((x) => (x.id === ap.id ? { ...x, subject: e.target.value } : x)) })}
              placeholder="AP Calculus BC"
              maxLength={80}
            />
            <input
              style={{ width: 76 }}
              type="number"
              inputMode="numeric"
              min="1"
              max="7"
              value={ap.score}
              onChange={(e) => set({ apScores: aps.map((x) => (x.id === ap.id ? { ...x, score: e.target.value } : x)) })}
              placeholder="5"
              aria-label={t('Score')}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => set({ apScores: aps.filter((x) => x.id !== ap.id) })} aria-label={t('Remove')}>
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => set({ apScores: [...aps, { id: newId(), subject: '', score: '' }] })}>
        <Icon name="plus" size={15} /> {t('Add exam')}
      </button>
    </Section>
  );
}

/* ---------------------- Activities (graded + AI polish) ---------------------- */
function Activities({ p, update }) {
  const { t } = useT();
  const acts = p.activities || [];
  const set = (next) => update({ activities: next });
  const add = () => set([...acts, { id: newId(), position: '', organization: '', description: '', years: '', hours: '' }]);
  const patch = (id, k, v) => set(acts.map((a) => (a.id === id ? { ...a, [k]: v } : a)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= acts.length) return;
    const next = [...acts];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };

  return (
    <Section
      title={t('Extracurriculars')}
      hint={t('Up to 10, most important first. Each one is graded on role, reach, measurable results and time — a specific description with numbers counts far more than a title.')}
      count={`${acts.length}/10`}
    >
      <div style={{ display: 'grid', gap: 14 }}>
        {acts.map((a, i) => (
          <ActivityRow
            key={a.id}
            a={a}
            index={i}
            total={acts.length}
            patch={patch}
            move={move}
            remove={() => set(acts.filter((x) => x.id !== a.id))}
          />
        ))}
      </div>
      {acts.length < 10 && (
        <button className="btn btn-ghost btn-sm" onClick={add} style={{ marginTop: 14 }}>
          <Icon name="plus" size={15} /> {t('Add activity')}
        </button>
      )}
      {acts.length === 0 && (
        <p className="muted" style={{ fontSize: 13.5, marginTop: 10 }}>
          {t('Clubs, jobs, sports, research, volunteering, projects, family responsibilities — all count.')}
        </p>
      )}
    </Section>
  );
}

const SIGNAL_TEXT = {
  role_founder: 'Founder / top leadership role',
  role_lead: 'Leadership role',
  role_officer: 'Defined responsibility',
  role_member: 'Membership — no leadership shown',
  scope_international: 'International reach',
  scope_national: 'National reach',
  scope_regional: 'City / regional reach',
  scope_school: 'School-level reach',
  quantified: 'Measurable results',
  no_numbers: 'No numbers — add scale or results',
  distinction: 'Recognised result or output',
  no_commitment: 'Add years and hours per week',
  vague: 'Too vague to credit — describe what you did',
};

function ActivityRow({ a, index, total, patch, move, remove }) {
  const { t, lang } = useT();
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState(null);
  const [tip, setTip] = useState('');
  const [err, setErr] = useState('');
  const grade = gradeActivity(a);
  const filled = a.position || a.organization || a.description;

  async function enhance() {
    if (!a.description.trim()) {
      setErr(t('Write a rough description first — even one line.'));
      return;
    }
    setErr('');
    setBusy(true);
    setVariants(null);
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'activity', role: a.position, organization: a.organization, text: a.description, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setVariants(data.variants || []);
      setTip(data.tip || '');
    } catch (e) {
      setErr(t(e.message));
    } finally {
      setBusy(false);
    }
  }

  const hints = grade.signals.filter((s) => ['role_member', 'no_numbers', 'no_commitment', 'vague'].includes(s.key));

  return (
    <div className="act-row">
      <div className="act-top">
        <span className="act-num">{index + 1}</span>
        {filled ? (
          <>
            <TierBadge tier={grade.tier} />
            <span className="muted" style={{ fontSize: 12.5 }}>
              {grade.score}/100{grade.source === 'ai' ? ` · ${t('AI-graded')}` : ''}
            </span>
          </>
        ) : null}
        <span style={{ flex: 1 }} />
        <button className="sb-icon" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t('Move up')} title={t('Move up')}>
          ↑
        </button>
        <button className="sb-icon" onClick={() => move(index, 1)} disabled={index === total - 1} aria-label={t('Move down')} title={t('Move down')}>
          ↓
        </button>
        <button className="sb-icon" onClick={remove} aria-label={t('Remove activity')} title={t('Remove activity')}>
          <Icon name="trash" size={16} />
        </button>
      </div>
      <div className="row row-2">
        <input value={a.position} onChange={(e) => patch(a.id, 'position', e.target.value)} placeholder={t('Role — e.g. Founder & President')} maxLength={100} aria-label={t('Role')} />
        <input value={a.organization} onChange={(e) => patch(a.id, 'organization', e.target.value)} placeholder={t('Organization — e.g. School Robotics Club')} maxLength={100} aria-label={t('Organization')} />
      </div>
      <textarea
        style={{ marginTop: 10 }}
        value={a.description}
        onChange={(e) => patch(a.id, 'description', e.target.value)}
        placeholder={t('What you did and what changed because of it. Numbers help: people reached, money raised, results.')}
        maxLength={1000}
        aria-label={t('Description')}
      />
      <div className="act-bottom">
        <input type="number" inputMode="numeric" min="0" max="6" value={a.years} onChange={(e) => patch(a.id, 'years', e.target.value)} placeholder={t('Years')} aria-label={t('Years')} />
        <input type="number" inputMode="numeric" min="0" max="40" value={a.hours} onChange={(e) => patch(a.id, 'hours', e.target.value)} placeholder={t('Hours / week')} aria-label={t('Hours / week')} />
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={enhance} disabled={busy}>
          {busy ? <Spinner /> : <Icon name="spark" size={15} />} {busy ? t('Rewriting…') : t('Rewrite with AI')}
        </button>
      </div>

      {filled && hints.length > 0 && (
        <p className="act-hint">
          {hints.map((h) => t(SIGNAL_TEXT[h.key])).join(' · ')}
        </p>
      )}
      {grade.source === 'ai' && grade.improve && <p className="act-hint">{grade.improve}</p>}
      {err && <p className="error-text">{err}</p>}

      {variants && (
        <div className="fade-in" style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <div className="sub-title">{t('Pick a version (applications are in English)')}</div>
          {variants.map((v, i) => (
            <div key={i} className="act-variant">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{t(v.label)}</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{v.text}</div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  patch(a.id, 'description', v.text);
                  setVariants(null);
                }}
              >
                {t('Use')}
              </button>
            </div>
          ))}
          {tip && <p className="muted" style={{ fontSize: 13 }}>{tip}</p>}
        </div>
      )}
      <style>{`
        .act-row{border:1px solid var(--line); border-radius:var(--r); padding:14px; background:var(--surface-2);}
        .act-top{display:flex; align-items:center; gap:8px; margin-bottom:10px;}
        .act-num{width:24px; height:24px; border-radius:6px; background:var(--surface); border:1px solid var(--line);
          display:inline-flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:700; color:var(--muted);}
        .act-top .sb-icon{width:32px; height:32px; font-size:15px;}
        .act-top .sb-icon:disabled{opacity:.3; cursor:default;}
        .act-bottom{display:flex; gap:8px; margin-top:10px; align-items:center; flex-wrap:wrap;}
        .act-bottom input{width:120px;}
        .act-hint{font-size:12.5px; color:var(--warn); margin-top:8px; line-height:1.45;}
        .act-variant{display:flex; gap:12px; align-items:center; background:var(--surface); border:1px solid var(--line); border-radius:var(--r-sm); padding:10px 12px;}
        @media (max-width:520px){ .act-bottom input{flex:1 1 40%; width:auto;} .act-bottom .btn{flex:1 1 100%;} .act-variant{flex-direction:column; align-items:stretch;} }
      `}</style>
    </div>
  );
}

/* ---------------------------- Honors ---------------------------- */
function Honors({ p, update }) {
  const { t } = useT();
  const honors = p.honors || [];
  const set = (next) => update({ honors: next });
  const add = () => set([...honors, { id: newId(), title: '', level: 'school', grade: '' }]);
  const patch = (id, k, v) => set(honors.map((h) => (h.id === id ? { ...h, [k]: v } : h)));

  return (
    <Section
      title={t('Honors & awards')}
      hint={t('Up to 5. Include the result (gold, 2nd place, finalist) — level and placement decide the weight.')}
      count={`${honors.length}/5`}
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {honors.map((h) => {
          const g = gradeHonor(h);
          return (
            <div key={h.id} className="honor-row">
              <input
                style={{ flex: '3 1 220px' }}
                value={h.title}
                onChange={(e) => patch(h.id, 'title', e.target.value)}
                placeholder={t('e.g. National Math Olympiad — Silver medal')}
                maxLength={140}
                aria-label={t('Award title')}
              />
              <select style={{ flex: '1 1 140px' }} value={h.level} onChange={(e) => patch(h.id, 'level', e.target.value)} aria-label={t('Level')}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {t(LEVEL_LABEL[l])}
                  </option>
                ))}
              </select>
              {h.title.trim() && <span className="pill pill-muted" title={t('Honor weight')}>{g.score}/100</span>}
              <button className="sb-icon" onClick={() => set(honors.filter((x) => x.id !== h.id))} aria-label={t('Remove')}>
                <Icon name="trash" size={16} />
              </button>
            </div>
          );
        })}
      </div>
      {honors.length < 5 && (
        <button className="btn btn-ghost btn-sm" onClick={add} style={{ marginTop: 12 }}>
          <Icon name="plus" size={15} /> {t('Add honor')}
        </button>
      )}
      <style>{`.honor-row{display:flex; gap:8px; flex-wrap:wrap; align-items:center;}`}</style>
    </Section>
  );
}

/* --------------------------- Narrative --------------------------- */
function Narrative({ p, update }) {
  const { t } = useT();
  const n = p.narrative;
  const set = (patch) => update({ narrative: { ...n, ...patch } });
  const words = String(n.personalStatement || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <Section title={t('Narrative')} hint={t('The thread that ties your application together.')}>
      <Field label={t('Your spike')} hint={t('the one thing you are known for')}>
        <input value={n.spike} onChange={(e) => set({ spike: e.target.value })} placeholder={t('Building accessible tech for rural schools')} maxLength={160} />
      </Field>
      <Field label={t('Personal statement draft')} hint={t('{n} words', { n: words })}>
        <textarea
          style={{ minHeight: 140 }}
          value={n.personalStatement}
          onChange={(e) => set({ personalStatement: e.target.value })}
          placeholder={t('Draft or outline your main essay. Rough is fine.')}
          maxLength={9000}
        />
      </Field>
      <Link href="/essay" className="btn btn-ghost btn-sm">
        <Icon name="pen" size={15} /> {t('Open the essay coach')}
      </Link>
    </Section>
  );
}
