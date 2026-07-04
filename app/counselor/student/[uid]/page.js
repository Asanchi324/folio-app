'use client';

// Read-only student portfolio for counselors: full profile, AI review (the
// student's saved one), reference odds, and the comment thread.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAccount } from '@/lib/account';
import { useComments, addComment, setResolved, COMMENT_SECTIONS } from '@/lib/comments';
import { studentSummary } from '@/lib/insights';
import { estimateChance, BAND_META } from '@/lib/chances';
import { getUniversity } from '@/lib/universities';
import PortfolioView from '@/components/PortfolioView';

export default function StudentDetail() {
  const { uid } = useParams();
  const { user, ready, profile } = useAccount();
  const [state, setState] = useState({ status: 'loading', p: null, updatedAt: null });

  useEffect(() => {
    const db = getDb();
    if (!ready) return;
    if (!db || !user) {
      setState({ status: 'denied', p: null });
      return;
    }
    getDoc(doc(db, 'portfolios', uid))
      .then((snap) => {
        if (!snap.exists()) setState({ status: 'empty', p: null });
        else setState({ status: 'ok', p: snap.data().data || null, updatedAt: snap.data().updatedAt });
      })
      .catch(() => setState({ status: 'denied', p: null }));
  }, [uid, ready, user]);

  if (state.status === 'loading') {
    return <div className="wrap" style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading student…</div>;
  }
  if (state.status === 'denied') {
    return (
      <div className="wrap" style={{ padding: 60, textAlign: 'center' }}>
        <p className="muted">You don’t have access to this portfolio — the student may have disconnected.</p>
        <Link href="/counselor" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>← Back to roster</Link>
      </div>
    );
  }

  const p = state.p;
  const summary = studentSummary(p);
  const fb = p?.savedFeedback;

  // Reference odds: one hard-reach + one target-tier anchor so the counselor
  // instantly calibrates the profile. Same math as the student's chances page.
  const refs = ['mit', 'umich']
    .map((id) => getUniversity(id))
    .filter(Boolean)
    .map((u) => ({ u, est: estimateChance(p || {}, u) }));

  return (
    <div className="wrap" style={{ padding: '32px 24px 100px' }}>
      <Link href="/counselor" className="muted" style={{ fontSize: 13.5 }}>← Back to roster</Link>

      <div className="sd-grid" style={{ marginTop: 18 }}>
        <div style={{ minWidth: 0 }}>
          {state.status === 'empty' || !p ? (
            <div className="card card-pad">
              <p className="muted">This student hasn’t filled anything in yet.</p>
            </div>
          ) : (
            <PortfolioView p={p} options={{ narrative: true }} />
          )}
        </div>

        <div style={{ display: 'grid', gap: 18, alignContent: 'start', minWidth: 0 }}>
          {/* quick calibration */}
          <div className="card card-pad">
            <SectionTitle>Reference odds</SectionTitle>
            {refs.map(({ u, est }) => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name.replace('Massachusetts Institute of Technology', 'MIT')}</span>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`pill band-${est.band}`} style={{ fontSize: 10.5 }}>{BAND_META[est.band].label}</span>
                  <b style={{ fontSize: 14 }}>{est.chance}%</b>
                </span>
              </div>
            ))}
            <p className="muted" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.45 }}>
              Anchors only — the student sees the full list on their chances page.
            </p>
          </div>

          {/* next steps */}
          <div className="card card-pad">
            <SectionTitle>Suggested talking points</SectionTitle>
            {summary.steps.map((s) => (
              <div key={s} style={{ display: 'flex', gap: 8, fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>
                <span style={{ color: 'var(--accent)' }}>→</span>
                <span>{s}</span>
              </div>
            ))}
          </div>

          {/* student's saved AI review */}
          {fb && (
            <div className="card card-pad">
              <SectionTitle>Their AI review</SectionTitle>
              <p style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>“{fb.headline}”</p>
              {Array.isArray(fb.gaps) && fb.gaps.length > 0 && (
                <ul style={{ margin: '10px 0 0', paddingLeft: 16, display: 'grid', gap: 5 }}>
                  {fb.gaps.slice(0, 3).map((g, i) => (
                    <li key={i} style={{ fontSize: 12.5, lineHeight: 1.45 }}>{g}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Comments studentUid={uid} user={user} authorName={profile?.displayName || user?.displayName} />
        </div>
      </div>

      <style>{`
        .sd-grid{display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:24px; align-items:start;}
        @media (max-width:940px){.sd-grid{grid-template-columns:1fr;}}
      `}</style>
    </div>
  );
}

function Comments({ studentUid, user, authorName }) {
  const { comments } = useComments(studentUid);
  const [text, setText] = useState('');
  const [section, setSection] = useState('general');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    try {
      await addComment(studentUid, {
        authorUid: user.uid,
        authorName: authorName || 'Counselor',
        text,
        section,
      });
      setText('');
    } catch (e) {
      setErr('Could not post the comment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card-pad">
      <SectionTitle>Comments ({comments.length})</SectionTitle>
      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        <select value={section} onChange={(e) => setSection(e.target.value)} style={{ fontSize: 13 }}>
          {COMMENT_SECTIONS.map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Feedback the student will see in their builder…"
          style={{ minHeight: 70, fontSize: 13.5 }}
        />
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy || !text.trim()}>
          {busy ? 'Posting…' : 'Post comment'}
        </button>
        {err && <p style={{ color: 'var(--bad)', fontSize: 12.5 }}>{err}</p>}
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {comments.map((c) => (
          <div key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 10, opacity: c.resolved ? 0.55 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5 }}>
              <span className="muted">
                <b>{c.authorName}</b> · {COMMENT_SECTIONS.find(([v]) => v === c.section)?.[1] || 'General'}
              </span>
              <span className="muted">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 4 }}>{c.text}</p>
            {c.resolved ? (
              <span className="pill band-safety" style={{ fontSize: 10.5, marginTop: 6 }}>✓ Resolved by student</span>
            ) : c.authorUid === user?.uid ? (
              <button
                onClick={() => setResolved(studentUid, c.id, true).catch(() => {})}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11.5, cursor: 'pointer', padding: 0, marginTop: 6 }}
              >
                Mark resolved
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
      {children}
    </div>
  );
}
