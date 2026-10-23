'use client';

// AI essay coach (on /essay). Pro feature: free users get a few reviews/day
// (enforced server-side), then the API returns upgrade:true.

import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/auth';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import { Spinner, UpgradeNote } from '@/components/ui';
import { HOOK_LABEL, HOOK_SAMPLE } from '@/lib/essay-hooks';

const SCORE_LABELS = { structure: 'Structure', voice: 'Voice', specificity: 'Specificity', impact: 'Impact' };

export default function EssayCoach({ essay }) {
  const { t, lang } = useT();
  const [promptQ, setPromptQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(null);
  const [err, setErr] = useState('');
  const [upgrade, setUpgrade] = useState(false);
  const [signin, setSignin] = useState(false);
  const [showAfter, setShowAfter] = useState(true);

  async function run() {
    setBusy(true);
    setErr('');
    setUpgrade(false);
    setSignin(false);
    try {
      const data = await apiPost('/api/essay', { essay, promptQuestion: promptQ, lang });
      setReview(data.review);
      track('essay_review', { plan: data.plan });
    } catch (e) {
      setErr(t(e.message));
      if (e.data?.upgrade) setUpgrade(true);
      if (e.data?.signin) setSignin(true);
    } finally {
      setBusy(false);
    }
  }

  const ready = (essay || '').trim().length >= 120;

  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 20 }}>{t('Coach review')}</h2>
        <span className="pill pill-gold">{t('Pro · a few free reviews a day')}</span>
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
        {t('Structure, show-don’t-tell, line edits and a before/after of your weakest paragraph. It never invents facts.')}
      </p>

      {!review && (
        <div style={{ marginTop: 16 }}>
          <input
            value={promptQ}
            onChange={(e) => setPromptQ(e.target.value)}
            placeholder={t('Optional: the essay prompt you are answering')}
            maxLength={400}
          />
          <button className="btn btn-gold btn-block" onClick={run} disabled={busy || !ready} style={{ marginTop: 12 }}>
            {busy ? (
              <>
                <Spinner /> {t('Reading your draft…')}
              </>
            ) : ready ? (
              t('Review my essay')
            ) : (
              t('Write at least a few paragraphs first')
            )}
          </button>
        </div>
      )}

      {err && !upgrade && (
        <p className="error-text">
          {err}{' '}
          {signin && <Link href="/login">{t('Sign in')} →</Link>}
        </p>
      )}
      {upgrade && <UpgradeNote message={err} />}

      {review && (
        <div className="stagger" style={{ display: 'grid', gap: 14, marginTop: 18 }}>
          <div>
            <p style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.45 }}>{review.verdict}</p>
            {review.score && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginTop: 14 }}>
                {Object.entries(review.score).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{t(SCORE_LABELS[k] || k)}</span>
                      <span className="muted">{v}/10</span>
                    </div>
                    <div className="bar" style={{ marginTop: 4 }}>
                      <span style={{ width: `${Math.min(10, Number(v) || 0) * 10}%`, background: 'var(--ink-2)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {review.structure && (
            <Panel title={t('Structure')}>
              <p style={{ fontSize: 14, lineHeight: 1.55 }}>{review.structure.assessment}</p>
              {(review.structure.issues || []).map((i, idx) => (
                <p key={idx} style={{ fontSize: 13.5, marginTop: 6, color: 'var(--ink-2)' }}>
                  — {i}
                </p>
              ))}
            </Panel>
          )}

          {review.hook?.diagnosis && (
            <Panel
              title={t('Hook')}
              right={
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {review.hook.type ? t(HOOK_LABEL[review.hook.type]) : ''}
                  {Number.isFinite(review.hook.strength) ? ` · ${review.hook.strength}/10` : ''}
                </span>
              }
            >
              <p style={{ fontSize: 14, lineHeight: 1.55 }}>{review.hook.diagnosis}</p>
              {(review.hook.alternatives || []).map((a, i) => (
                <div key={i} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {a.type ? t(HOOK_LABEL[a.type]) : t('Another way in')}
                  </div>
                  <p style={{ fontSize: 14, marginTop: 6, padding: '8px 10px', background: 'var(--good-tint)', borderRadius: 6, lineHeight: 1.5 }}>
                    {a.opening}
                  </p>
                  {a.why && <p className="muted" style={{ fontSize: 13, marginTop: 5 }}>{a.why}</p>}
                </div>
              ))}
              <p className="muted" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
                {t('Compared with how {n} essays published by admissions offices open (Johns Hopkins, Hamilton, Tufts, Connecticut College).', { n: HOOK_SAMPLE })}
              </p>
            </Panel>
          )}

          {Array.isArray(review.showDontTell) && review.showDontTell.length > 0 && (
            <Panel title={t('Show, don’t tell')}>
              {review.showDontTell.map((s, i) => (
                <div key={i} style={{ marginTop: i ? 12 : 0, paddingTop: i ? 12 : 0, borderTop: i ? '1px solid var(--line)' : 'none' }}>
                  <p style={{ fontSize: 13.5, color: 'var(--muted)', fontStyle: 'italic' }}>“{s.quote}”</p>
                  <p style={{ fontSize: 13, marginTop: 5 }}>{s.why}</p>
                  <p style={{ fontSize: 13.5, marginTop: 6, padding: '8px 10px', background: 'var(--good-tint)', borderRadius: 6, lineHeight: 1.5 }}>
                    {s.showInstead}
                  </p>
                </div>
              ))}
            </Panel>
          )}

          {review.beforeAfter?.rewrite && (
            <Panel
              title={t('Before / after')}
              right={
                <div className="lang-seg">
                  <button className={!showAfter ? 'on' : ''} onClick={() => setShowAfter(false)}>
                    {t('Before')}
                  </button>
                  <button className={showAfter ? 'on' : ''} onClick={() => setShowAfter(true)}>
                    {t('After')}
                  </button>
                </div>
              }
            >
              <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {showAfter ? review.beforeAfter.rewrite : review.beforeAfter.paragraph}
              </p>
              {showAfter && review.beforeAfter.whatChanged && (
                <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                  {review.beforeAfter.whatChanged}
                </p>
              )}
            </Panel>
          )}

          {Array.isArray(review.lineEdits) && review.lineEdits.length > 0 && (
            <Panel title={t('Line edits')}>
              {review.lineEdits.map((e, i) => (
                <div key={i} style={{ fontSize: 13.5, marginTop: i ? 8 : 0, lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{e.quote}</span>
                  {' → '}
                  <span style={{ fontWeight: 600 }}>{e.suggestion}</span>
                  {e.reason && <span className="muted"> · {e.reason}</span>}
                </div>
              ))}
            </Panel>
          )}

          {Array.isArray(review.nextDraftFocus) && (
            <Panel title={t('Next draft — focus on')}>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
                {review.nextDraftFocus.map((f, i) => (
                  <li key={i} style={{ fontSize: 14, lineHeight: 1.5 }}>
                    {f}
                  </li>
                ))}
              </ol>
            </Panel>
          )}

          <button className="btn btn-ghost btn-sm" onClick={() => setReview(null)} style={{ justifySelf: 'start' }}>
            {t('Review again')}
          </button>
        </div>
      )}
    </div>
  );
}

function Panel({ title, right, children }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div className="sub-title">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}
