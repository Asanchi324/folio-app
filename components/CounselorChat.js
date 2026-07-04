'use client';

// AI counselor chat — the flagship Pro feature, rendered in the portfolio
// sidebar. History persists to portfolios/{uid}/chat/main when signed in
// (localStorage otherwise). Free users get 3 messages/day server-side; the
// 429 response flips the panel into an upsell.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAccount } from '@/lib/account';
import { apiPost } from '@/lib/auth';
import { track } from '@/lib/analytics';

const LOCAL_KEY = 'folio:counselor-chat';
const MAX_STORED = 60;

const STARTERS = [
  'Where can I realistically get in?',
  'What should I do this summer?',
  'How do I strengthen my profile for CS?',
];

export default function CounselorChat({ portfolio }) {
  const { user } = useAccount();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [upgrade, setUpgrade] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef(null);
  const loadedFor = useRef(null);

  // Load history: Firestore when signed in, localStorage otherwise.
  useEffect(() => {
    const db = getDb();
    const key = user ? user.uid : 'local';
    if (loadedFor.current === key) return;
    loadedFor.current = key;
    if (db && user) {
      getDoc(doc(db, 'portfolios', user.uid, 'chat', 'main'))
        .then((snap) => setMessages(snap.exists() ? snap.data().messages || [] : []))
        .catch(() => {});
    } else {
      try {
        setMessages(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'));
      } catch {
        setMessages([]);
      }
    }
  }, [user]);

  // Persist (debounced-ish: after each turn completes).
  function persist(next) {
    const trimmed = next.slice(-MAX_STORED);
    const db = getDb();
    if (db && user) {
      setDoc(doc(db, 'portfolios', user.uid, 'chat', 'main'), {
        messages: trimmed,
        updatedAt: Date.now(),
      }).catch(() => {});
    } else {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(trimmed));
      } catch {}
    }
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy, open]);

  async function send(textArg) {
    const text = (textArg ?? input).trim();
    if (!text || busy) return;
    setInput('');
    setErr('');
    setUpgrade(false);
    const next = [...messages, { role: 'user', text, at: Date.now() }];
    setMessages(next);
    setBusy(true);
    try {
      const data = await apiPost('/api/counselor', {
        message: text,
        history: next.slice(-7, -1),
        portfolio,
      });
      const withReply = [...next, { role: 'assistant', text: data.reply, at: Date.now() }];
      setMessages(withReply);
      persist(withReply);
      track('counselor_chat_message', { plan: data.plan });
    } catch (e) {
      setErr(e.message);
      if (e.data?.upgrade) setUpgrade(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ overflow: 'hidden', border: '1px solid var(--accent)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '16px 18px',
          background: 'linear-gradient(135deg, var(--accent-tint), var(--surface))',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 20 }}>🎓</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: 15, fontFamily: 'var(--display-ui)' }}>
            AI counselor
          </span>
          <span className="muted" style={{ fontSize: 12 }}>
            Honest strategy chat about YOUR profile
          </span>
        </span>
        <span className="pill pill-gold" style={{ fontSize: 10.5 }}>PRO · 3 free/day</span>
        <span aria-hidden style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
      </button>

      {open && (
        <div>
          <div
            ref={scrollRef}
            style={{ maxHeight: 320, overflowY: 'auto', padding: '14px 16px', display: 'grid', gap: 10, background: 'var(--surface-2)' }}
          >
            {messages.length === 0 && (
              <div>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  Ask anything an experienced counselor would answer — school list,
                  summer plans, ED strategy. It knows your portfolio.
                </p>
                <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{ textAlign: 'left', fontSize: 12.5, padding: '8px 11px', borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', cursor: 'pointer' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  justifySelf: m.role === 'user' ? 'end' : 'start',
                  maxWidth: '88%',
                  padding: '9px 12px',
                  borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                  background: m.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                  color: m.role === 'user' ? '#fff' : 'var(--ink)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--line)',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="muted" style={{ fontSize: 12.5 }}>Thinking about your profile…</div>
            )}
            {err && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: upgrade ? 'var(--accent-tint)' : 'var(--bad-tint)' }}>
                <p style={{ fontSize: 12.5, lineHeight: 1.5, color: upgrade ? '#8a611a' : 'var(--bad)' }}>{err}</p>
                {upgrade && (
                  <Link href="/upgrade?plan=pro" className="btn btn-gold btn-sm" style={{ marginTop: 8 }}>
                    Unlock full access →
                  </Link>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--line)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask your counselor…"
              style={{ flex: 1, fontSize: 13.5 }}
            />
            <button className="btn btn-gold btn-sm" onClick={() => send()} disabled={busy || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
