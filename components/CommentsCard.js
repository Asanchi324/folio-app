'use client';

// Student-side view of counselor comments (top of the portfolio page).
// Students mark a comment done — their signal back to the mentor.

import { useState } from 'react';
import { useAccount } from '@/lib/account';
import { useComments, setResolved, COMMENT_SECTIONS } from '@/lib/comments';
import { useT } from '@/lib/i18n';

export default function CommentsCard({ meta }) {
  const { user } = useAccount();
  const { t, locale } = useT();
  const { comments } = useComments(meta?.orgId && user ? user.uid : null);
  const [showResolved, setShowResolved] = useState(false);

  if (!meta?.orgId || !user || comments.length === 0) return null;

  const open = comments.filter((c) => !c.resolved);
  const shown = showResolved ? comments : open;

  return (
    <section className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h2 style={{ fontSize: 19, flex: 1 }}>{t('From your counselor')}</h2>
        {open.length > 0 && <span className="pill">{t('{n} open', { n: open.length })}</span>}
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {shown.length === 0 && <p className="muted" style={{ fontSize: 14 }}>{t('All caught up.')}</p>}
        {shown.map((c) => (
          <div
            key={c.id}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '11px 13px', opacity: c.resolved ? 0.6 : 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5 }}>
              <span className="muted">
                <b>{c.authorName}</b> · {t(COMMENT_SECTIONS.find(([v]) => v === c.section)?.[1] || 'General')}
              </span>
              <span className="muted">{new Date(c.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, marginTop: 5, whiteSpace: 'pre-wrap' }}>{c.text}</p>
            {!c.resolved && (
              <button
                onClick={() => setResolved(user.uid, c.id, true).catch(() => {})}
                style={{ background: 'none', border: 'none', color: 'var(--good)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 6 }}
              >
                {t('Mark as done')}
              </button>
            )}
          </div>
        ))}
      </div>

      {comments.length > open.length && (
        <button
          onClick={() => setShowResolved((s) => !s)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: 0, marginTop: 10 }}
        >
          {showResolved ? t('Hide resolved') : t('Show resolved ({n})', { n: comments.length - open.length })}
        </button>
      )}
    </section>
  );
}
