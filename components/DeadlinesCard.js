'use client';

// "My deadlines" — portfolio sidebar. In-app reminders: countdown badges for
// every opportunity the student tracks from /discover. Recurring yearly, so
// 9th–10th graders see next year's cycle too (they plan years ahead).

import Link from 'next/link';
import { upcomingDeadlines, urgency, formatDeadline } from '@/lib/deadlines';

export default function DeadlinesCard({ p, update }) {
  const tracked = upcomingDeadlines(p.trackedDeadlines || []);

  function untrack(id) {
    update((prev) => ({
      ...prev,
      trackedDeadlines: (prev.trackedDeadlines || []).filter((t) => t.id !== id),
    }));
  }

  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>⏰</span>
        <h3 style={{ fontSize: 17, flex: 1 }}>My deadlines</h3>
        {tracked.length > 0 && tracked[0].days <= 14 && (
          <span className="pill band-hard-reach" style={{ fontSize: 10.5 }}>soon!</span>
        )}
      </div>

      {tracked.length === 0 ? (
        <>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.55 }}>
            Track application windows for olympiads and programs — they’ll show up
            here with a countdown.
          </p>
          <Link href="/discover" className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%' }}>
            Browse opportunities →
          </Link>
        </>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {tracked.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.name}
                </div>
                <div className="muted" style={{ fontSize: 11.5 }}>
                  {t.label} · {formatDeadline(t.month)} {t.next.getFullYear()}
                </div>
              </div>
              <span className={`pill ${urgency(t.days)}`} style={{ fontSize: 11, flexShrink: 0 }}>
                in {t.days}d
              </span>
              <button
                onClick={() => untrack(t.id)}
                aria-label={`Stop tracking ${t.name}`}
                style={{ background: 'none', border: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 14, padding: 2 }}
              >
                ✕
              </button>
            </div>
          ))}
          <p className="muted" style={{ fontSize: 11, lineHeight: 1.45 }}>
            Months are approximate — always verify with the official source.
          </p>
        </div>
      )}
    </div>
  );
}
