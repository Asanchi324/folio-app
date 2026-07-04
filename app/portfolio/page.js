'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortfolio, newId } from '@/lib/store';
import { profileBreakdown, completeness } from '@/lib/profile';
import { track } from '@/lib/analytics';
import Ring from '@/components/Ring';
import MentorCard from '@/components/MentorCard';
import CommentsCard from '@/components/CommentsCard';
import EssayCoach from '@/components/EssayCoach';
import CounselorChat from '@/components/CounselorChat';
import ShareCard from '@/components/ShareCard';
import DeadlinesCard from '@/components/DeadlinesCard';

const LEVELS = ['school', 'regional', 'state', 'national', 'international'];

export default function PortfolioPage() {
  const router = useRouter();
  const [p, update, ready, meta] = usePortfolio();

  // First-time visitors go through the onboarding survey first.
  useEffect(() => {
    if (ready && !p.onboarded && !p.fullName) router.replace('/start');
  }, [ready, p.onboarded, p.fullName, router]);

  useEffect(() => {
    track('portfolio_view');
  }, []);

  const breakdown = useMemo(() => profileBreakdown(p), [p]);
  const complete = useMemo(() => completeness(p), [p]);

  if (!ready) {
    return (
      <div className="wrap" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--muted)' }}>
        Loading your portfolio…
      </div>
    );
  }

  return (
    <div className="wrap" style={{ padding: '34px 24px 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,40px)' }}>Your portfolio</h1>
          <p className="muted" style={{ marginTop: 8, fontSize: 16 }}>
            Fill it in like the Common App. Everything saves automatically to this device.
          </p>
        </div>
        <Link href="/universities" className="btn btn-ghost btn-sm">
          See my chances →
        </Link>
      </div>

      <div className="pf-grid">
        {/* ---------------- LEFT: form ---------------- */}
        <div className="pf-form">
          <Basics p={p} update={update} />
          <Academics p={p} update={update} />
          <Testing p={p} update={update} />
          <Activities p={p} update={update} />
          <Honors p={p} update={update} />
          <Narrative p={p} update={update} />
        </div>

        {/* ---------------- RIGHT: dashboard ---------------- */}
        <div className="pf-side">
          <StrengthCard breakdown={breakdown} complete={complete} />
          <CounselorChat portfolio={p} />
          <FeedbackCard p={p} update={update} />
          <CommentsCard meta={meta} />
          <DeadlinesCard p={p} update={update} />
          <ShareCard p={p} meta={meta} />
          <MentorCard meta={meta} />
        </div>
      </div>

      <style>{`
        .pf-grid{
          display:grid;
          grid-template-columns:minmax(0,1fr) 340px;
          gap:28px;
          margin-top:28px;
          align-items:start;
        }
        .pf-form{display:grid; gap:20px; min-width:0;}
        .pf-side{position:sticky; top:86px; display:grid; gap:20px; min-width:0;}
        @media (max-width: 940px){
          .pf-grid{grid-template-columns:1fr;}
          .pf-side{position:static; order:-1;}
        }
      `}</style>
    </div>
  );
}

/* =========================== sections =========================== */

function Section({ title, hint, children, count }) {
  return (
    <section className="card card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <h2 style={{ fontSize: 22 }}>{title}</h2>
        {count != null && <span className="pill pill-muted">{count}</span>}
      </div>
      {hint && <p className="muted" style={{ marginTop: -10, marginBottom: 18, fontSize: 13.5 }}>{hint}</p>}
      {children}
    </section>
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

function Basics({ p, update }) {
  return (
    <Section title="Basics">
      <div className="row row-2">
        <Field label="Full name">
          <input value={p.fullName} onChange={(e) => update({ fullName: e.target.value })} placeholder="Aisha Karimova" />
        </Field>
        <Field label="Intended major" hint="be specific">
          <input value={p.intendedMajor} onChange={(e) => update({ intendedMajor: e.target.value })} placeholder="Computer Science" />
        </Field>
      </div>
      <div className="row row-2">
        <Field label="Country">
          <input value={p.country} onChange={(e) => update({ country: e.target.value })} placeholder="Kazakhstan" />
        </Field>
        <Field label="Grade / year">
          <select value={p.gradeLevel} onChange={(e) => update({ gradeLevel: e.target.value })}>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
            <option value="gap">Gap year</option>
          </select>
        </Field>
      </div>
    </Section>
  );
}

function Academics({ p, update }) {
  const a = p.academics;
  const set = (patch) => update({ academics: { ...a, ...patch } });
  return (
    <Section title="Academics">
      <div className="row row-3">
        <Field label="GPA">
          <input type="number" step="0.01" value={a.gpa} onChange={(e) => set({ gpa: e.target.value })} placeholder="3.9" />
        </Field>
        <Field label="GPA scale">
          <select value={a.gpaScale} onChange={(e) => set({ gpaScale: e.target.value })}>
            <option value="4">out of 4.0</option>
            <option value="5">out of 5.0</option>
            <option value="100">out of 100</option>
          </select>
        </Field>
        <Field label="Class rank" hint="optional">
          <input value={a.classRank} onChange={(e) => set({ classRank: e.target.value })} placeholder="3 / 120" />
        </Field>
      </div>
      <Field label="Course rigor" hint="AP / IB / honors load">
        <input value={a.rigor} onChange={(e) => set({ rigor: e.target.value })} placeholder="5 APs, IB Higher Level Math & Physics" />
      </Field>
    </Section>
  );
}

function Testing({ p, update }) {
  const t = p.testing;
  const set = (patch) => update({ testing: { ...t, ...patch } });
  const aps = t.apScores || [];
  return (
    <Section title="Testing">
      <div className="row row-2">
        <Field label="SAT total" hint="400–1600">
          <input type="number" value={t.sat} onChange={(e) => set({ sat: e.target.value })} placeholder="1480" />
        </Field>
        <Field label="ACT" hint="optional, 1–36">
          <input type="number" value={t.act} onChange={(e) => set({ act: e.target.value })} placeholder="33" />
        </Field>
      </div>
      <div className="row row-2">
        <Field label="IELTS" hint="0–9">
          <input type="number" step="0.5" value={t.ielts} onChange={(e) => set({ ielts: e.target.value })} placeholder="7.5" />
        </Field>
        <Field label="TOEFL" hint="optional, 0–120">
          <input type="number" value={t.toefl} onChange={(e) => set({ toefl: e.target.value })} placeholder="105" />
        </Field>
      </div>

      <div style={{ marginTop: 6 }}>
        <span className="field-label">AP / IB exam scores</span>
        {aps.map((ap, i) => (
          <div key={ap.id} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <input
              style={{ flex: 2 }}
              value={ap.subject}
              onChange={(e) => set({ apScores: aps.map((x) => (x.id === ap.id ? { ...x, subject: e.target.value } : x)) })}
              placeholder="AP Calculus BC"
            />
            <input
              style={{ width: 90 }}
              type="number"
              value={ap.score}
              onChange={(e) => set({ apScores: aps.map((x) => (x.id === ap.id ? { ...x, score: e.target.value } : x)) })}
              placeholder="5"
            />
            <button className="btn btn-ghost btn-sm" onClick={() => set({ apScores: aps.filter((x) => x.id !== ap.id) })} aria-label="Remove">
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={() => set({ apScores: [...aps, { id: newId(), subject: '', score: '' }] })}>
          + Add exam
        </button>
      </div>
    </Section>
  );
}

/* ---------------------- Activities (with AI) ---------------------- */
function Activities({ p, update }) {
  const acts = p.activities || [];
  const set = (next) => update({ activities: next });
  const add = () =>
    set([
      ...acts,
      { id: newId(), position: '', organization: '', description: '', years: '', hours: '' },
    ]);
  const patch = (id, k, v) => set(acts.map((a) => (a.id === id ? { ...a, [k]: v } : a)));

  return (
    <Section title="Extracurriculars" hint="Up to 10, most important first — just like the Common App." count={`${acts.length}/10`}>
      <div style={{ display: 'grid', gap: 16 }}>
        {acts.map((a) => (
          <ActivityRow key={a.id} a={a} patch={patch} remove={() => set(acts.filter((x) => x.id !== a.id))} />
        ))}
      </div>
      {acts.length < 10 && (
        <button className="btn btn-ghost btn-sm" onClick={add} style={{ marginTop: 16 }}>
          + Add activity
        </button>
      )}
      {acts.length === 0 && (
        <p className="muted" style={{ fontSize: 13.5, marginTop: 12 }}>
          Clubs, jobs, sports, research, volunteering, projects, family responsibilities — all count.
        </p>
      )}
    </Section>
  );
}

function ActivityRow({ a, patch, remove }) {
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState(null);
  const [tip, setTip] = useState('');
  const [err, setErr] = useState('');

  async function enhance() {
    if (!a.description.trim()) {
      setErr('Write a rough description first — even one line.');
      return;
    }
    setErr('');
    setBusy(true);
    setVariants(null);
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'activity', role: a.position, organization: a.organization, text: a.description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setVariants(data.variants || []);
      setTip(data.tip || '');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 16, background: 'var(--surface-2)' }}>
      <div className="row row-2">
        <input value={a.position} onChange={(e) => patch(a.id, 'position', e.target.value)} placeholder="Position / role — e.g. Founder & President" />
        <input value={a.organization} onChange={(e) => patch(a.id, 'organization', e.target.value)} placeholder="Organization — e.g. School Robotics Club" />
      </div>
      <textarea
        style={{ marginTop: 12 }}
        value={a.description}
        onChange={(e) => patch(a.id, 'description', e.target.value)}
        placeholder="What you did and the impact. Don't worry about polish — let the AI sharpen it."
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input style={{ width: 130 }} value={a.years} onChange={(e) => patch(a.id, 'years', e.target.value)} placeholder="Years (e.g. 3)" />
        <input style={{ width: 150 }} value={a.hours} onChange={(e) => patch(a.id, 'hours', e.target.value)} placeholder="Hrs/wk (e.g. 6)" />
        <div style={{ flex: 1 }} />
        <button className="btn btn-gold btn-sm" onClick={enhance} disabled={busy}>
          {busy ? <Spinner /> : '✨'} {busy ? 'Polishing…' : 'Polish with AI'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={remove} aria-label="Remove activity">✕</button>
      </div>

      {err && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 10 }}>{err}</p>}

      {variants && (
        <div className="fade-in" style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Pick a sharper version
          </div>
          {variants.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)' }}>{v.label}</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{v.text}</div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  patch(a.id, 'description', v.text);
                  setVariants(null);
                }}
              >
                Use
              </button>
            </div>
          ))}
          {tip && <p className="muted" style={{ fontSize: 13 }}>💡 {tip}</p>}
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Honors ---------------------------- */
function Honors({ p, update }) {
  const honors = p.honors || [];
  const set = (next) => update({ honors: next });
  const add = () => set([...honors, { id: newId(), title: '', level: 'school', grade: '' }]);
  const patch = (id, k, v) => set(honors.map((h) => (h.id === id ? { ...h, [k]: v } : h)));

  return (
    <Section title="Honors & awards" hint="Up to 5. Level matters a lot — international beats school." count={`${honors.length}/5`}>
      <div style={{ display: 'grid', gap: 12 }}>
        {honors.map((h) => (
          <div key={h.id} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input style={{ flex: 3, minWidth: 200 }} value={h.title} onChange={(e) => patch(h.id, 'title', e.target.value)} placeholder="Award title — e.g. National Math Olympiad, Silver" />
            <select style={{ flex: 1, minWidth: 150 }} value={h.level} onChange={(e) => patch(h.id, 'level', e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => set(honors.filter((x) => x.id !== h.id))} aria-label="Remove">✕</button>
          </div>
        ))}
      </div>
      {honors.length < 5 && (
        <button className="btn btn-ghost btn-sm" onClick={add} style={{ marginTop: 14 }}>+ Add honor</button>
      )}
    </Section>
  );
}

/* --------------------------- Narrative --------------------------- */
function Narrative({ p, update }) {
  const n = p.narrative;
  const set = (patch) => update({ narrative: { ...n, ...patch } });
  return (
    <Section title="Narrative" hint="The thread that ties your application together.">
      <Field label="Your spike" hint="the one thing you're known for">
        <input value={n.spike} onChange={(e) => set({ spike: e.target.value })} placeholder="Building accessible tech for rural schools" />
      </Field>
      <Field label="Personal statement draft" hint="rough is fine">
        <textarea
          style={{ minHeight: 130 }}
          value={n.personalStatement}
          onChange={(e) => set({ personalStatement: e.target.value })}
          placeholder="Draft or outline your main essay here. The AI uses it to judge how clear and compelling your story is."
        />
      </Field>
      <EssayCoach essay={n.personalStatement} />
    </Section>
  );
}

/* ===================== right-side dashboard ===================== */

function StrengthCard({ breakdown, complete }) {
  const { strength, pillars } = breakdown;
  const color =
    strength >= 75 ? 'var(--good)' : strength >= 50 ? 'var(--primary)' : strength >= 30 ? 'var(--warn)' : 'var(--bad)';
  const tier = strength >= 80 ? 'Exceptional' : strength >= 62 ? 'Strong' : strength >= 42 ? 'Competitive' : 'Developing';

  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Ring value={strength} size={104} stroke={11} color={color} label={strength} sublabel="/ 100" />
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Profile strength</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 600, color }}>{tier}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{complete}% complete</div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        {pillars.map((pl) => (
          <div key={pl.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{pl.label}</span>
              <span className="muted">{pl.score}</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--line)', marginTop: 5, overflow: 'hidden' }}>
              <div style={{ width: `${pl.score}%`, height: '100%', background: 'var(--primary)', transition: 'width .5s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackCard({ p, update }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fb = p.savedFeedback;

  async function run() {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio: p }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      update({ savedFeedback: { ...data.feedback, at: Date.now(), sig: feedbackSignature(p) } });
      track('feedback_view', { tier: data.feedback?.overallTier || 'unknown' });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Saved review is stale if the portfolio changed since it ran (or predates
  // signatures entirely). We DON'T render stale content — a review of an old
  // portfolio can describe activities the student already deleted — so we hide
  // it and show a refresh prompt instead.
  const stale = fb ? !fb.sig || fb.sig !== feedbackSignature(p) : false;
  const showReview = fb && !stale;

  return (
    <div className="card card-pad" style={{ background: showReview ? 'var(--surface)' : 'linear-gradient(180deg,var(--primary),var(--primary-600))', color: showReview ? 'var(--ink)' : '#fff' }}>
      {showReview ? (
        <Feedback fb={fb} busy={busy} err={err} onRerun={run} />
      ) : (
        <>
          <div style={{ fontSize: 26 }}>✨</div>
          <h3 style={{ color: '#fff', fontSize: 21, marginTop: 10 }}>
            {stale ? 'Refresh your AI review' : 'AI portfolio review'}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>
            {stale
              ? 'Your portfolio changed since the last review, so it’s hidden to avoid stale advice. Re-run it to match what’s in your profile now.'
              : 'An honest read of your strengths, gaps, and the highest-impact things to do next — with specific olympiads and targets.'}
          </p>
          <button className="btn btn-gold" onClick={run} disabled={busy} style={{ marginTop: 18, width: '100%' }}>
            {busy ? <><Spinner /> Analyzing…</> : stale ? 'Refresh my review' : 'Get my AI feedback'}
          </button>
          {err && <p style={{ color: '#ffd9d9', fontSize: 13, marginTop: 10 }}>{err}</p>}
        </>
      )}
    </div>
  );
}

function Feedback({ fb, busy, err, onRerun }) {
  const tierColor = { exceptional: 'var(--good)', strong: 'var(--primary)', competitive: 'var(--warn)', developing: 'var(--bad)' }[(fb.overallTier || '').toLowerCase()] || 'var(--primary)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="pill" style={{ background: 'var(--accent-tint)', color: '#8a611a' }}>{fb.overallTier}</span>
        <button className="btn btn-ghost btn-sm" onClick={onRerun} disabled={busy}>{busy ? <Spinner /> : '↻'} Re-run</button>
      </div>
      <h3 style={{ fontSize: 19, marginTop: 14, lineHeight: 1.3 }}>{fb.headline}</h3>

      <Block title="Strengths" color="var(--good)" items={fb.strengths} />
      <Block title="Gaps" color="var(--bad)" items={fb.gaps} />

      {Array.isArray(fb.recommendations) && fb.recommendations.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <SubTitle>Recommendations</SubTitle>
          <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
            {fb.recommendations.map((r, i) => {
              // New shape groups advice under r.items; tolerate the old flat
              // shape (action/detail straight on r) for feedback saved earlier.
              const items = Array.isArray(r.items) && r.items.length
                ? r.items
                : [{ action: r.action, detail: r.detail, competitions: r.competitions }];
              return (
                <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.area}</span>
                    {r.priority && <span className={`pill ${prioBand(r.priority)}`} style={{ fontSize: 11 }}>{r.priority}</span>}
                  </div>
                  {r.overview && (
                    <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{r.overview}</div>
                  )}
                  <div style={{ display: 'grid', gap: 9, marginTop: 10 }}>
                    {items.filter((it) => it && it.action).map((it, j) => (
                      <div key={j}>
                        <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', gap: 7 }}>
                          <span style={{ color: 'var(--accent)' }}>→</span>
                          <span>{it.action}</span>
                        </div>
                        {it.detail && (
                          <div className="muted" style={{ fontSize: 13, marginTop: 3, lineHeight: 1.5, paddingLeft: 18 }}>{it.detail}</div>
                        )}
                        {Array.isArray(it.competitions) && it.competitions.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7, paddingLeft: 18 }}>
                            {it.competitions.map((c) => (
                              <span key={c} className="pill pill-gold" style={{ fontSize: 11.5 }}>{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Array.isArray(fb.nextSemester) && fb.nextSemester.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <SubTitle>Do next</SubTitle>
          <ol style={{ margin: '8px 0 0', paddingLeft: 18, display: 'grid', gap: 6 }}>
            {fb.nextSemester.map((s, i) => (
              <li key={i} style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      <Link href="/discover" className="btn btn-ghost btn-sm" style={{ marginTop: 18, width: '100%' }}>
        Find these in the database →
      </Link>
      {err && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 10 }}>{err}</p>}
    </div>
  );
}

function Block({ title, color, items }) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <SubTitle>{title}</SubTitle>
      <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
        {items.map((t, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13.5, lineHeight: 1.5 }}>
            <span style={{ color, fontWeight: 800 }}>{title === 'Strengths' ? '✓' : '!'}</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubTitle({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
      {children}
    </div>
  );
}

function prioBand(p) {
  return { high: 'band-reach', medium: 'band-target', low: 'band-safety' }[(p || '').toLowerCase()] || 'pill-muted';
}

// Stable fingerprint of the inputs the AI review depends on. If the portfolio
// changes (an activity edited or removed), this changes — so a saved review can
// be flagged out of date instead of silently showing advice about content the
// student already deleted.
function feedbackSignature(p) {
  const pick = {
    major: p.intendedMajor || '',
    academics: p.academics || {},
    testing: p.testing || {},
    activities: (p.activities || []).map((a) => `${a.position}|${a.organization}|${a.description}`),
    honors: (p.honors || []).map((h) => `${h.title}|${h.level}`),
    narrative: p.narrative || {},
  };
  const str = JSON.stringify(pick);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return h.toString(36);
}

function Spinner() {
  return (
    <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: '-2px' }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
