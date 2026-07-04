'use client';

// Student-side view of counselor comments (portfolio sidebar). Students can
// mark a comment resolved — that's their "done" signal back to the mentor.

import { useState } from 'react';
import { useAccount } from '@/lib/account';
import { useComments, setResolved, COMMENT_SECTIONS } from '@/lib/comments';

export default function CommentsCard({ meta }) {
  const { user } = useAccount();
  const { comments } = useComments(meta?.orgId && user ? user.uid : null);
  const [showResolved, setShowResolved] = useState(false);

  if (!meta?.orgId || !user || comments.length === 0) return null;

  const open = comments.filter((c) => !c.resolved);
  const shown = showResolved ? comments : open;

  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <h3 style={{ fontSize: 17, flex: 1 }}>From your mentor</h3>
        {open.length > 0 && (
          <span className="pill pill-gold" style={{ fontSize: 11.5 }}>{open.length} new</span>
        )}
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        {shown.length === 0 && (
          <p className="muted" style={{ fontSize: 13 }}>All caught up ✓</p>
        )}
        {shown.map((c) => (
          <div key={c.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '10px 12px', opacity: c.resolved ? 0.6 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span className="muted"><b>{c.authorName}</b> · {COMMENT_SECTIONS.find(([v]) => v === c.section)?.[1] || 'General'}</span>
              <span className="muted">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 5 }}>{c.text}</p>
            {!c.resolved && (
              <button
                onClick={() => setResolved(user.uid, c.id, true).catch(() => {})}
                style={{ background: 'none', border: 'none', color: 'var(--good)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 6 }}
              >
                ✓ Mark as done
              </button>
            )}
          </div>
        ))}
      </div>

      {comments.length > open.length && (
        <button
          onClick={() => setShowResolved((s) => !s)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12.5, cursor: 'pointer', padding: 0, marginTop: 10 }}
        >
          {showResolved ? 'Hide resolved' : `Show resolved (${comments.length - open.length})`}
        </button>
      )}
    </div>
  );
}
