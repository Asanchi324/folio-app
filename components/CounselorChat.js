'use client';

// AI counselor chat — full-page on /advisor. History persists to
// portfolios/{uid}/chat/main when signed in (localStorage otherwise). Free
// users get 3 messages/day server-side; the 429 response shows the upsell.

import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAccount } from '@/lib/account';
import { apiPost } from '@/lib/auth';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import { UpgradeNote } from '@/components/ui';
import Icon from '@/components/Icon';

const LOCAL_KEY = 'folio:counselor-chat';
const MAX_STORED = 60;

const STARTERS = [
  'Where can I realistically get in?',
  'What should I do this summer?',
  'Which of my activities is weakest, and how do I fix it?',
  'How do I build a balanced university list?',
];

export default function CounselorChat({ portfolio }) {
  const { user } = useAccount();
  const { t, lang } = useT();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [upgrade, setUpgrade] = useState(false);
  const scrollRef = useRef(null);
  const loadedFor = useRef(null);

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

  function clearHistory() {
    setMessages([]);
    persist([]);
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

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
        lang,
      });
      const withReply = [...next, { role: 'assistant', text: data.reply, at: Date.now() }];
      setMessages(withReply);
      persist(withReply);
      track('counselor_chat_message', { plan: data.plan });
    } catch (e) {
      setErr(t(e.message));
      if (e.data?.upgrade) setUpgrade(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card chat">
      <div ref={scrollRef} className="chat-log">
        {messages.length === 0 && (
          <div style={{ maxWidth: 520 }}>
            <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
              {t('Ask what you would ask an experienced counselor — your school list, summer plans, early decision strategy. It reads your portfolio before answering.')}
            </p>
            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              {STARTERS.map((s) => (
                <button key={s} className="chat-starter" onClick={() => send(t(s))}>
                  {t(s)}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role === 'user' ? 'me' : 'them'}`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="muted" style={{ fontSize: 13 }}>{t('Reading your profile…')}</div>}
        {err && !upgrade && <p className="error-text">{err}</p>}
        {upgrade && <UpgradeNote message={err} />}
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('Ask your counselor…')}
          maxLength={2000}
          aria-label={t('Message')}
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !input.trim()} aria-label={t('Send')}>
          <Icon name="arrow" size={18} />
        </button>
      </form>
      {messages.length > 0 && (
        <button className="chat-clear" onClick={clearHistory}>
          {t('Clear conversation')}
        </button>
      )}
      <style>{`
        .chat{display:flex; flex-direction:column; overflow:hidden; min-height:min(640px, calc(100dvh - 190px));}
        .chat-log{flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:10px; background:var(--surface-2);}
        .chat-msg{max-width:min(620px, 88%); padding:10px 13px; border-radius:12px; font-size:14.5px; line-height:1.55; white-space:pre-wrap; overflow-wrap:anywhere;}
        .chat-msg.me{align-self:flex-end; background:var(--primary); color:#fff; border-bottom-right-radius:4px;}
        .chat-msg.them{align-self:flex-start; background:var(--surface); border:1px solid var(--line); border-bottom-left-radius:4px;}
        .chat-starter{text-align:left; font:500 14px var(--sans); padding:10px 13px; border-radius:var(--r-sm); border:1px solid var(--line-strong); background:var(--surface); cursor:pointer; color:var(--ink);}
        .chat-starter:hover{border-color:var(--ink-2);}
        .chat-input{display:flex; gap:8px; padding:12px; border-top:1px solid var(--line);}
        .chat-input input{flex:1;}
        .chat-clear{align-self:flex-start; margin:0 12px 12px; background:none; border:0; color:var(--muted); font-size:12.5px; cursor:pointer; padding:0;}
      `}</style>
    </div>
  );
}
