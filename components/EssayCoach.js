'use client';

// AI essay coach panel — lives in the Narrative section of the builder.
// Premium feature (gold accent): free users get 1 review/day (enforced
// server-side), then see the upgrade prompt the API returns.

import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/auth';
import { track } from '@/lib/analytics';

export default function EssayCoach({ essay }) {
  const [promptQ, setPromptQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(null);
  const [err, setErr] = useState('');
  const [upgrade, setUpgrade] = useState(false);
  const [showAfter, setShowAfter] = useState(true);

  async function run() {
    setBusy(true);
    setErr('');
    setUpgrade(false);
    try {
      const data = await apiPost('/api/essay', { essay, promptQuestion: promptQ });
      setReview(data.review);
      track('essay_review', { plan: data.plan });
    } catch (e) {
      setErr(e.message);
      if (e.data?.upgrade) setUpgrade(true);
    } finally {
      setBusy(false);
    }
  }

  const ready = (essay || '').trim().length >= 120;

  return (
    <div style={{ marginTop: 18, border: '1px solid var(--accent)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18 }}>🖋</span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>AI essay coach</div>
          <div className="muted" style={{ fontSize: 12 }}>
            Structure · show-don’t-tell · line edits · before/after
          </div>
        </div>
        <span className="pill pill-gold" style={{ fontSize: 10.5 }}>PRO · free taste</span>
      </div>

      <div style={{ padding: 18 }}>
        {!review && (
          <>
            <input
              value={promptQ}
              onChange={(e) => setPromptQ(e.target.value)}
              placeholder="Optional: the essay prompt/question you're answering"
              style={{ fontSize: 13.5 }}
            />
            <button
              className="btn btn-gold"
              onClick={run}
              disabled={busy || !ready}
              style={{ marginTop: 12, width: '100%' }}
              title={ready ? '' : 'Write your draft above first (120+ characters)'}
            >
              {busy ? 'Reading your draft…' : ready ? 'Coach my essay' : 'Write your draft above first'}
            </button>
          </>
        )}

        {err && (
          <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 'var(--r-sm)', background: upgrade ? 'var(--accent-tint)' : 'var(--bad-tint)' }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: upgrade ? '#8a611a' : 'var(--bad)' }}>{err}</p>
            {upgrade && (
              <Link href="/upgrade?plan=pro" className="btn btn-gold btn-sm" style={{ marginTop: 10 }}>
                Unlock with Pro →
              </Link>
            )}
          </div>
        )}

        {review && (
          <div className="fade-in" style={{ display: 'grid', gap: 14 }}>
            {/* verdict + scores */}
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45 }}>“{review.verdict}”</p>
              {review.score && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginTop: 12 }}>
                  {Object.entries(review.score).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{k}</span>
                        <span className="muted">{v}/10</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 99, background: 'var(--line)', marginTop: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(10, Number(v) || 0) * 10}%`, height: '100%', background: 'var(--accent)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {review.structure && (
              <Panel title="Structure">
                <p style={{ fontSize: 13.5, lineHeight: 1.55 }}>{review.structure.assessment}</p>
                {(review.structure.issues || []).map((i, idx) => (
                  <p key={idx} style={{ fontSize: 13, marginTop: 6, display: 'flex', gap: 7 }}>
                    <span style={{ color: 'var(--bad)', fontWeight: 800 }}>!</span> {i}
                  </p>
                ))}
              </Panel>
            )}

            {Array.isArray(review.showDontTell) && review.showDontTell.length > 0 && (
              <Panel title="Show, don’t tell">
                {review.showDontTell.map((s, i) => (
                  <div key={i} style={{ marginTop: i ? 12 : 0, paddingTop: i ? 12 : 0, borderTop: i ? '1px solid var(--line)' : 'none' }}>
                    <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>“{s.quote}”</p>
                    <p style={{ fontSize: 12.5, marginTop: 5 }}>{s.why}</p>
                    <p style={{ fontSize: 13, marginTop: 6, padding: '8px 10px', background: 'var(--good-tint)', borderRadius: 6, lineHeight: 1.5 }}>
                      {s.showInstead}
                    </p>
                  </div>
                ))}
              </Panel>
            )}

            {review.beforeAfter?.rewrite && (
              <Panel
                title="Before / after"
                right={
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Toggle on={!showAfter} onClick={() => setShowAfter(false)}>Before</Toggle>
                    <Toggle on={showAfter} onClick={() => setShowAfter(true)}>After</Toggle>
                  </div>
                }
              >
                <p style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {showAfter ? review.beforeAfter.rewrite : review.beforeAfter.paragraph}
                </p>
                {showAfter && review.beforeAfter.whatChanged && (
                  <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>💡 {review.beforeAfter.whatChanged}</p>
                )}
              </Panel>
            )}

            {Array.isArray(review.lineEdits) && review.lineEdits.length > 0 && (
              <Panel title="Line edits">
                {review.lineEdits.map((e, i) => (
                  <div key={i} style={{ fontSize: 13, marginTop: i ? 8 : 0, lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{e.quote}</span>
                    {' → '}
                    <span style={{ fontWeight: 600 }}>{e.suggestion}</span>
                    {e.reason && <span className="muted"> · {e.reason}</span>}
                  </div>
                ))}
              </Panel>
            )}

            {Array.isArray(review.nextDraftFocus) && (
              <Panel title="Next draft — focus on">
                <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
                  {review.nextDraftFocus.map((f, i) => (
                    <li key={i} style={{ fontSize: 13.5, lineHeight: 1.5 }}>{f}</li>
                  ))}
                </ol>
              </Panel>
            )}

            <button className="btn btn-ghost btn-sm" onClick={() => setReview(null)}>
              ← Review another draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({ title, right, children }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--accent)' }}>
          {title}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 999,
        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line-strong)'),
        background: on ? 'var(--accent)' : 'transparent',
        color: on ? '#fff' : 'var(--muted)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
