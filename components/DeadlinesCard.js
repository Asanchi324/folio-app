'use client';

// Deadlines — merges two sources into one countdown list:
//   1. Application rounds for every university on the student's shortlist.
//   2. Olympiad / program windows tracked from /discover.
// Items can be checked off per cycle (they re-appear next year). Reminder
// preferences are stored now so email delivery can be switched on later.

import { useState } from 'react';
import Link from 'next/link';
import { UNIVERSITIES } from '@/lib/universities';
import { allDeadlines, urgency, daysLeftMsg, formatDeadline, DEFAULT_REMINDER_PREFS } from '@/lib/deadlines';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';

export default function DeadlinesCard({ p, update }) {
  const { t } = useT();
  const [showDone, setShowDone] = useState(false);
  const items = allDeadlines(p, UNIVERSITIES);
  const upcoming = items.filter((it) => !it.done);
  const done = items.filter((it) => it.done);
  const prefs = { ...DEFAULT_REMINDER_PREFS, ...(p.reminderPrefs || {}) };

  function toggleDone(item) {
    update((prev) => {
      const map = { ...(prev.completedDeadlines || {}) };
      if (item.done) delete map[item.key];
      else map[item.key] = item.next.getFullYear();
      return { ...prev, completedDeadlines: map };
    });
  }

  function remove(item) {
    if (item.source === 'competition') {
      update((prev) => ({ ...prev, trackedDeadlines: (prev.trackedDeadlines || []).filter((x) => x.id !== item.refId) }));
    } else {
      update((prev) => ({ ...prev, shortlist: (prev.shortlist || []).filter((id) => id !== item.refId) }));
    }
  }

  function setEmailReminders(on) {
    update((prev) => ({
      ...prev,
      reminderPrefs: { ...DEFAULT_REMINDER_PREFS, ...(prev.reminderPrefs || {}), email: on },
    }));
  }

  if (items.length === 0) {
    return (
      <section className="card card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <Icon name="calendar" size={28} style={{ color: 'var(--faint)' }} />
        <h2 style={{ fontSize: 19, marginTop: 10 }}>{t('Nothing tracked yet')}</h2>
        <p className="muted" style={{ fontSize: 14.5, marginTop: 8, lineHeight: 1.55, maxWidth: 440, marginInline: 'auto' }}>
          {t('Add universities to your list and track olympiads — their application windows appear here with a countdown.')}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <Link href="/universities" className="btn btn-primary btn-sm">{t('Add universities')}</Link>
          <Link href="/discover" className="btn btn-ghost btn-sm">{t('Browse opportunities')}</Link>
        </div>
      </section>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 18 }}>
      <section className="card">
        {upcoming.map((it) => (
          <Row key={it.key} it={it} onDone={() => toggleDone(it)} onRemove={() => remove(it)} />
        ))}
        {upcoming.length === 0 && (
          <p className="muted" style={{ fontSize: 14, padding: 18 }}>{t('Everything is checked off. New windows appear as they come up.')}</p>
        )}
        {done.length > 0 && (
          <div style={{ borderTop: '1px solid var(--line)' }}>
            <button className="dl-toggle" onClick={() => setShowDone((s) => !s)}>
              {showDone ? '▾' : '▸'} {t('Done ({n})', { n: done.length })}
            </button>
            {showDone && done.map((it) => <Row key={it.key} it={it} onDone={() => toggleDone(it)} onRemove={() => remove(it)} />)}
          </div>
        )}
      </section>

      <section className="card card-pad">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={Boolean(prefs.email)} onChange={(e) => setEmailReminders(e.target.checked)} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t('Email me before each deadline')}</span>
          <span className="pill pill-muted" style={{ marginLeft: 'auto' }}>{t('coming soon')}</span>
        </label>
        <p className="muted" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
          {prefs.email
            ? t('On — we will remind you {days} days before, once email delivery launches.', { days: prefs.leadDays.join(', ') })
            : t('A reminder 30, 7 and 1 day before each one.')}
        </p>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          {t('Months are approximate — always confirm exact dates with the official source.')}
        </p>
      </section>

      <style>{`
        .dl-row{display:flex; align-items:center; gap:12px; padding:14px 18px; border-bottom:1px solid var(--line);}
        .dl-row:last-child{border-bottom:0;}
        .dl-check{transition:background .25s var(--ease), border-color .25s var(--ease), transform .2s var(--ease); width:22px; height:22px; flex-shrink:0; border-radius:6px; cursor:pointer; padding:0;
          display:flex; align-items:center; justify-content:center; color:#fff;}
        .dl-toggle{background:none; border:0; color:var(--muted); cursor:pointer; font-size:13.5px; font-weight:600; padding:12px 18px;}
        .dl-x{background:none; border:0; color:var(--faint); cursor:pointer; padding:6px; flex-shrink:0;}
      `}</style>
    </div>
  );
}

function Row({ it, onDone, onRemove }) {
  const { t, locale } = useT();
  const isUni = it.source === 'university';
  const [msg, vars] = daysLeftMsg(it.days);
  return (
    <div className="dl-row">
      <button
        className="dl-check"
        onClick={onDone}
        aria-label={it.done ? t('Mark as not done') : t('Mark as done')}
        style={{ border: `1.5px solid ${it.done ? 'var(--good)' : 'var(--line-strong)'}`, background: it.done ? 'var(--good)' : 'transparent' }}
      >
        {it.done ? <Icon name="check" size={14} strokeWidth={2.4} className="pop" /> : null}
      </button>
      <div style={{ flex: 1, minWidth: 0, opacity: it.done ? 0.55 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className={`pill ${isUni ? 'band-target' : 'pill-muted'}`} style={{ flexShrink: 0 }}>
            {isUni ? t('University') : t('Program')}
          </span>
          <span style={{ fontSize: 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: it.done ? 'line-through' : 'none' }}>
            {it.name}
          </span>
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          {t(it.label)} · {formatDeadline(it.month, locale)} {it.next.getFullYear()}
        </div>
      </div>
      {!it.done && <span className={`pill ${urgency(it.days)}`} style={{ flexShrink: 0 }}>{t(msg, vars)}</span>}
      <button className="dl-x" onClick={onRemove} aria-label={t('Remove')} title={isUni ? t('Remove from my list') : t('Stop tracking')}>
        <Icon name="close" size={15} />
      </button>
    </div>
  );
}
