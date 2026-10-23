'use client';

// Assessment — where the portfolio is graded: overall strength, every pillar,
// every activity and honor on the tier rubric, and the AI review. Running the
// AI review also grades each activity; those grades are stamped onto the
// activity with a signature of its text, so they stay valid until it's edited.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/store';
import {
  profileBreakdown,
  completeness,
  activityAssessments,
  honorAssessments,
  activitySignature,
  strengthTier,
} from '@/lib/profile';
import { reviewSnapshot, reviewSignature } from '@/lib/review-input';
import { apiPost } from '@/lib/auth';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import Ring from '@/components/Ring';
import Icon from '@/components/Icon';
import { PageHead, Loading, Spinner, TierBadge } from '@/components/ui';

const PILLAR_NOTE = {
  academics: 'GPA on a 4.0 scale, plus course rigor and class rank.',
  testing: 'SAT/ACT carries most of the weight; English and AP/IB add to it.',
  activities: 'Your strongest activities count most — depth beats a long list.',
  honors: 'Level and placement: an international medal outweighs school awards.',
  essays: 'Draft length, a clear major and a defined spike.',
};

export default function ReviewPage() {
  const { t } = useT();
  const [p, update, ready] = usePortfolio();
  const breakdown = useMemo(() => profileBreakdown(p), [p]);
  const complete = useMemo(() => completeness(p), [p]);

  if (!ready) return <Loading />;

  return (
    <div className="page">
      <PageHead
        title={t('Assessment')}
        sub={t('How an admissions reader would weigh your profile today — and what would move it most.')}
      />
      <div className="rv-grid">
        <div className="stagger" style={{ display: 'grid', gap: 18, minWidth: 0 }}>
          <StrengthCard breakdown={breakdown} complete={complete} />
          <ActivitiesCard p={p} />
          <HonorsCard p={p} />
        </div>
        <div style={{ minWidth: 0 }}>
          <FeedbackCard p={p} update={update} />
        </div>
      </div>
      <style>{`
        .rv-grid{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:18px; align-items:start;}
        @media (max-width:1100px){ .rv-grid{grid-template-columns:minmax(0,1fr);} }
      `}</style>
    </div>
  );
}

function StrengthCard({ breakdown, complete }) {
  const { t } = useT();
  const { strength, pillars } = breakdown;
  const color = strength >= 75 ? 'var(--good)' : strength >= 50 ? 'var(--primary)' : strength >= 30 ? 'var(--warn)' : 'var(--bad)';
  return (
    <section className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <Ring value={strength} size={96} stroke={10} color={color} label={strength} sublabel="/ 100" />
        <div>
          <div className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{t('Profile strength')}</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 24, color }}>{t(strengthTier(strength))}</div>
          <div className="muted" style={{ fontSize: 13 }}>{t('{n}% complete', { n: complete })}</div>
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
        {pillars.map((pl) => (
          <div key={pl.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>
                {t(pl.label)} <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>· {Math.round(pl.weight * 100)}%</span>
              </span>
              <span>{pl.score}</span>
            </div>
            <div className="bar" style={{ marginTop: 5 }}>
              <span style={{ width: `${pl.score}%`, background: 'var(--ink-2)' }} />
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{t(PILLAR_NOTE[pl.key])}</div>
          </div>
        ))}
      </div>
    </section>
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
  selective_program: 'Selective program — admission itself is a distinction',
  paid_program: 'Paid program — shows interest, not selection',
};

function ActivitiesCard({ p }) {
  const { t } = useT();
  const acts = p.activities || [];
  const graded = activityAssessments(p);
  if (!acts.length) {
    return (
      <section className="card card-pad">
        <h2 style={{ fontSize: 19 }}>{t('Extracurriculars')}</h2>
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
          {t('No activities yet — this is usually the biggest lever in a profile.')}{' '}
          <Link href="/portfolio" className="link">{t('Add them')}</Link>
        </p>
      </section>
    );
  }
  return (
    <section className="card card-pad">
      <h2 style={{ fontSize: 19 }}>{t('Extracurriculars, one by one')}</h2>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
        {t('Tier 1 is rare national or international distinction; Tier 4 is participation. Run the AI review for a reader’s judgement of each one.')}
      </p>
      <div className="stagger" style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {acts.map((a, i) => {
          const g = graded[i];
          if (!a.position && !a.organization && !a.description) return null;
          const hints = g.signals.filter((s) => s.key !== 'hours' && s.key !== 'empty');
          return (
            <div key={a.id} style={{ border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <TierBadge tier={g.tier} />
                <b style={{ fontSize: 14.5, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                  {[a.position, a.organization].filter(Boolean).join(' — ') || t('Untitled activity')}
                </b>
                <span className="muted" style={{ fontSize: 13 }}>{g.score}/100</span>
              </div>
              {g.source === 'ai' && g.reason ? (
                <p style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>{g.reason}</p>
              ) : (
                <p className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                  {hints.map((h) => t(SIGNAL_TEXT[h.key] || h.key)).join(' · ')}
                </p>
              )}
              {g.source === 'ai' && g.improve && (
                <p style={{ fontSize: 13, marginTop: 5, color: 'var(--primary-600)' }}>→ {g.improve}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const HONOR_SIGNAL = {
  place_gold: 'First place / gold',
  place_silver: 'Second place / silver',
  place_bronze: 'Third place / bronze',
  place_finalist: 'Finalist / honourable mention',
  place_participant: 'Participation only',
  place_unknown: 'Result not stated — add your placement',
  elite: 'Widely recognised competition',
};

function HonorsCard({ p }) {
  const { t } = useT();
  const honors = (p.honors || []).filter((h) => (h.title || '').trim());
  if (!honors.length) return null;
  const graded = honorAssessments({ honors });
  return (
    <section className="card card-pad">
      <h2 style={{ fontSize: 19 }}>{t('Honors & awards')}</h2>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {honors.map((h, i) => (
          <div key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 14 }}>
            <span style={{ fontWeight: 700, minWidth: 34 }}>{graded[i].score}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              {h.title}
              <span className="muted" style={{ fontSize: 12.5 }}>
                {' · '}
                {graded[i].signals.filter((s) => HONOR_SIGNAL[s.key]).map((s) => t(HONOR_SIGNAL[s.key])).join(' · ')}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ AI review ------------------------------ */

function FeedbackCard({ p, update }) {
  const { t, lang } = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fb = p.savedFeedback;

  async function run() {
    setBusy(true);
    setErr('');
    try {
      // Only the current-state slice is sent — never the previous review.
      const data = await apiPost('/api/feedback', { portfolio: reviewSnapshot(p), fresh: Boolean(fb), lang });
      const grades = Array.isArray(data.feedback?.activityGrades) ? data.feedback.activityGrades : [];
      update((prev) => {
        // Map grades back onto real activities: the server indexes the
        // non-blank rows in order, exactly as reviewSnapshot filters them.
        const real = (prev.activities || []).filter((a) => a.position || a.organization || a.description);
        const byId = new Map();
        real.forEach((a, i) => {
          const g = grades[i];
          if (g && Number.isFinite(Number(g.score))) {
            byId.set(a.id, { score: Number(g.score), reason: g.reason || '', improve: g.improve || '', sig: activitySignature(a), at: Date.now() });
          }
        });
        const { activityGrades, ...rest } = data.feedback || {};
        return {
          ...prev,
          activities: (prev.activities || []).map((a) => (byId.has(a.id) ? { ...a, aiGrade: byId.get(a.id) } : a)),
          savedFeedback: { ...rest, at: Date.now(), sig: reviewSignature(prev), lang },
        };
      });
      track('feedback_view', { tier: data.feedback?.overallTier || 'unknown' });
    } catch (e) {
      setErr(t(e.message));
    } finally {
      setBusy(false);
    }
  }

  // A review of an older version of the portfolio is hidden, not shown stale.
  const stale = fb ? !fb.sig || fb.sig !== reviewSignature(p) : false;
  const showReview = fb && !stale;

  if (!showReview) {
    return (
      <section className="card card-pad">
        <h2 style={{ fontSize: 20 }}>{stale ? t('Refresh your AI review') : t('AI review')}</h2>
        <p className="muted" style={{ fontSize: 14.5, marginTop: 8, lineHeight: 1.6 }}>
          {stale
            ? t('Your portfolio changed since the last review, so it is hidden to avoid outdated advice. Run it again to match your profile now.')
            : t('An honest read of your strengths and gaps, a grade for every activity, and the specific competitions and targets that would move you most.')}
        </p>
        <button className="btn btn-primary btn-block" onClick={run} disabled={busy} style={{ marginTop: 16 }}>
          {busy ? (
            <>
              <Spinner /> {t('Reading your portfolio…')}
            </>
          ) : stale ? (
            t('Run the review again')
          ) : (
            t('Get my AI review')
          )}
        </button>
        {err && <p className="error-text">{err}</p>}
      </section>
    );
  }

  return (
    <section className="card card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span className="pill">{t(TIER_LABEL[(fb.overallTier || '').toLowerCase()] || fb.overallTier || '')}</span>
        <button className="btn btn-ghost btn-sm" onClick={run} disabled={busy}>
          {busy ? <Spinner /> : null} {t('Run again')}
        </button>
      </div>
      <h3 style={{ fontSize: 18.5, marginTop: 14, lineHeight: 1.35 }}>{fb.headline}</h3>
      {fb.benchmarkComparison && (
        <p style={{ fontSize: 14, marginTop: 10, lineHeight: 1.55, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}>
          <b>{t('Compared with real admits')}:</b> {fb.benchmarkComparison}{' '}
          <Link href="/progress" className="link">{t('See them')}</Link>
        </p>
      )}

      <List title={t('Strengths')} items={fb.strengths} mark="+" color="var(--good)" />
      <List title={t('Gaps')} items={fb.gaps} mark="−" color="var(--bad)" />

      {Array.isArray(fb.recommendations) && fb.recommendations.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="sub-title">{t('What to do')}</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
            {fb.recommendations.map((r, i) => {
              const items = Array.isArray(r.items) && r.items.length ? r.items : [{ action: r.action, detail: r.detail, competitions: r.competitions }];
              return (
                <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{t(AREA_LABEL[r.area] || r.area)}</span>
                    {r.priority && <span className={`pill ${prioBand(r.priority)}`}>{t(PRIO_LABEL[(r.priority || '').toLowerCase()] || r.priority)}</span>}
                  </div>
                  {r.overview && <div className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>{r.overview}</div>}
                  <div style={{ display: 'grid', gap: 9, marginTop: 10 }}>
                    {items
                      .filter((it) => it && it.action)
                      .map((it, j) => (
                        <div key={j}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{it.action}</div>
                          {it.detail && <div className="muted" style={{ fontSize: 13.5, marginTop: 3, lineHeight: 1.5 }}>{it.detail}</div>}
                          {Array.isArray(it.competitions) && it.competitions.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
                              {it.competitions.map((c) => (
                                <span key={c} className="pill pill-muted">{c}</span>
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
        <div style={{ marginTop: 20 }}>
          <div className="sub-title">{t('Next 3–6 months')}</div>
          <ol style={{ margin: '8px 0 0', paddingLeft: 18, display: 'grid', gap: 6 }}>
            {fb.nextSemester.map((s, i) => (
              <li key={i} style={{ fontSize: 14, lineHeight: 1.5 }}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      <Link href="/discover" className="btn btn-ghost btn-sm" style={{ marginTop: 18 }}>
        <Icon name="compass" size={15} /> {t('Find these opportunities')}
      </Link>
      {fb.lang && fb.lang !== lang && (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>{t('This review was written in another language — run it again to get it in yours.')}</p>
      )}
      {err && <p className="error-text">{err}</p>}
    </section>
  );
}

const TIER_LABEL = { developing: 'Developing', competitive: 'Competitive', strong: 'Strong', exceptional: 'Exceptional' };
const AREA_LABEL = { Testing: 'Testing', Academics: 'Academics', Extracurriculars: 'Extracurriculars', Honors: 'Honors & awards', Narrative: 'Narrative' };
const PRIO_LABEL = { high: 'High priority', medium: 'Medium priority', low: 'Low priority' };

function List({ title, items, mark, color }) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div className="sub-title">{title}</div>
      <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
        {items.map((x, i) => (
          <li key={i} style={{ display: 'flex', gap: 9, fontSize: 14, lineHeight: 1.5 }}>
            <span style={{ color, fontWeight: 800, width: 10 }}>{mark}</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function prioBand(p) {
  return { high: 'band-hard-reach', medium: 'band-reach', low: 'band-safety' }[(p || '').toLowerCase()] || 'pill-muted';
}
