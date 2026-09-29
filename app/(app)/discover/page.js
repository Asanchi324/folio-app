'use client';

import { useEffect, useMemo, useState } from 'react';
import { COMPETITIONS, CATEGORIES } from '@/lib/competitions';
import { track } from '@/lib/analytics';
import { usePortfolio } from '@/lib/store';
import { deadlineFor, formatDeadline, nextOccurrence, daysUntil, urgency, daysLeftMsg } from '@/lib/deadlines';
import { useT } from '@/lib/i18n';
import { PageHead } from '@/components/ui';
import Icon from '@/components/Icon';

const TYPES = ['All', 'olympiad', 'competition', 'research', 'program', 'scholarship'];
const COSTS = ['All', 'free', 'paid', 'stipend'];
const TYPE_LABEL = { olympiad: 'Olympiad', competition: 'Competition', research: 'Research', program: 'Program', scholarship: 'Scholarship' };
const COST_META = {
  free: { label: 'Free', cls: 'band-safety' },
  paid: { label: 'Paid', cls: 'pill-muted' },
  stipend: { label: 'Paid to you', cls: 'pill-gold' },
};
const LEVEL_LABEL = { international: 'International', national: 'National', regional: 'Regional', online: 'Online' };
const PAGE = 24;

export default function DiscoverPage() {
  const { t } = useT();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [type, setType] = useState('All');
  const [cost, setCost] = useState('All');
  const [limit, setLimit] = useState(PAGE);
  const [p, update] = usePortfolio();

  useEffect(() => {
    track('discover_view');
  }, []);
  useEffect(() => setLimit(PAGE), [q, cat, type, cost]);

  const trackedIds = useMemo(() => new Set((p.trackedDeadlines || []).map((x) => x.id)), [p.trackedDeadlines]);

  function toggleTracked(c) {
    const hint = deadlineFor(c.id);
    if (!hint) return;
    update((prev) => {
      const cur = prev.trackedDeadlines || [];
      if (cur.some((x) => x.id === c.id)) return { ...prev, trackedDeadlines: cur.filter((x) => x.id !== c.id) };
      track('deadline_tracked', { id: c.id });
      return { ...prev, trackedDeadlines: [...cur, { id: c.id, name: c.name, label: hint.label, month: hint.month, addedAt: Date.now() }] };
    });
  }

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return COMPETITIONS.filter((c) => {
      if (cat !== 'All' && c.category !== cat) return false;
      if (type !== 'All' && c.type !== type) return false;
      if (cost !== 'All' && c.cost !== cost) return false;
      if (needle && !`${c.name} ${c.subject} ${c.category} ${c.blurb}`.toLowerCase().includes(needle)) return false;
      return true;
    }).sort((a, b) => b.difficulty - a.difficulty);
  }, [q, cat, type, cost]);

  return (
    <div className="page">
      <PageHead
        title={t('Opportunities')}
        sub={t('Olympiads, research programs, competitions and scholarships worth your time — the same list the AI recommends from.')}
      />

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search — e.g. physics, research, essay')} aria-label={t('Search opportunities')} style={{ maxWidth: 460 }} />

      <div className="dc-cats" role="tablist" aria-label={t('Category')}>
        {CATEGORIES.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={cat === c ? 'on' : ''}>
            {c === 'All' ? t('All') : t(c)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 'auto' }} aria-label={t('Format')}>
          {TYPES.map((x) => (
            <option key={x} value={x}>{x === 'All' ? t('All formats') : t(TYPE_LABEL[x])}</option>
          ))}
        </select>
        <select value={cost} onChange={(e) => setCost(e.target.value)} style={{ width: 'auto' }} aria-label={t('Cost')}>
          {COSTS.map((x) => (
            <option key={x} value={x}>{x === 'All' ? t('Any cost') : t(COST_META[x].label)}</option>
          ))}
        </select>
        <span className="muted" style={{ fontSize: 13.5, marginLeft: 'auto' }}>{t('{n} results', { n: list.length })}</span>
      </div>

      <div className="dc-grid stagger">
        {list.slice(0, limit).map((c) => (
          <CompCard key={c.id} c={c} tracked={trackedIds.has(c.id)} onTrack={toggleTracked} />
        ))}
      </div>
      {list.length > limit && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
            {t('Show more ({n} left)', { n: list.length - limit })}
          </button>
        </div>
      )}
      {list.length === 0 && <p className="muted" style={{ marginTop: 30 }}>{t('Nothing matches — try clearing a filter.')}</p>}

      <style>{`
        .dc-cats{display:flex; gap:6px; margin-top:14px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none;}
        .dc-cats::-webkit-scrollbar{display:none;}
        .dc-cats button{flex-shrink:0; font:600 13px var(--sans); padding:7px 12px; border-radius:var(--r-sm); border:1px solid var(--line-strong); background:var(--surface); color:var(--ink-2); cursor:pointer;}
        .dc-cats button.on{background:var(--ink); color:#fff; border-color:var(--ink);}
        .dc-grid{display:grid; gap:14px; margin-top:18px; grid-template-columns:repeat(auto-fill,minmax(min(100%,310px),1fr));}
      `}</style>
    </div>
  );
}

function CompCard({ c, tracked, onTrack }) {
  const { t, locale } = useT();
  const cost = COST_META[c.cost] || COST_META.paid;
  const hint = deadlineFor(c.id);
  const days = hint ? daysUntil(nextOccurrence(hint.month)) : null;
  const [msg, vars] = hint ? daysLeftMsg(days) : [null, null];
  return (
    <div className="card card-hover" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{t(c.category)}</span>
        <Difficulty n={c.difficulty} label={t('Difficulty {n}/5', { n: c.difficulty })} />
      </div>
      <h3 style={{ fontSize: 17, marginTop: 8 }}>{c.name}</h3>
      <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{c.subject}</div>
      <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 10, color: 'var(--ink-2)', flex: 1 }}>{c.blurb}</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        <span className="pill band-target">{t(TYPE_LABEL[c.type] || c.type)}</span>
        <span className={`pill ${cost.cls}`}>{t(cost.label)}</span>
        <span className="pill pill-muted">{t(LEVEL_LABEL[c.level] || c.level)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, minWidth: 0 }}>
          <div className="muted">{t('Timing')}</div>
          <div style={{ fontWeight: 600 }}>{c.season}</div>
          {hint && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              <span className={`pill ${urgency(days)}`}>
                {t(hint.label)}: {formatDeadline(hint.month, locale)} · {t(msg, vars)}
              </span>
              <button onClick={() => onTrack(c)} className={`pill ${tracked ? 'band-safety' : 'pill-muted'}`} style={{ cursor: 'pointer' }}>
                {tracked ? t('Tracking') : t('+ Track deadline')}
              </button>
            </div>
          )}
        </div>
        {c.link ? (
          <a
            href={c.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            onClick={() => track('opportunity_click', { id: c.id, category: c.category })}
          >
            {t('Official site')} ↗
          </a>
        ) : (
          <span className="pill pill-gold">{t('Self-started')}</span>
        )}
      </div>
    </div>
  );
}

function Difficulty({ n, label }) {
  return (
    <span title={label} aria-label={label} style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ width: 5, height: 12, borderRadius: 2, background: i <= n ? 'var(--ink-2)' : 'var(--line)' }} />
      ))}
    </span>
  );
}
