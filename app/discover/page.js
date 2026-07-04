'use client';

import { useEffect, useMemo, useState } from 'react';
import { COMPETITIONS, CATEGORIES } from '@/lib/competitions';
import { track } from '@/lib/analytics';

const TYPES = ['All', 'olympiad', 'competition', 'research', 'program', 'scholarship'];
const COSTS = ['All', 'free', 'paid', 'stipend'];

const TYPE_LABEL = {
  olympiad: 'Olympiad',
  competition: 'Competition',
  research: 'Research',
  program: 'Program',
  scholarship: 'Scholarship',
};
const COST_META = {
  free: { label: 'Free', cls: 'band-safety' },
  paid: { label: 'Paid', cls: 'pill-muted' },
  stipend: { label: 'Paid to you', cls: 'pill-gold' },
};

export default function DiscoverPage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [type, setType] = useState('All');
  const [cost, setCost] = useState('All');

  useEffect(() => {
    track('discover_view');
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return COMPETITIONS.filter((c) => {
      if (cat !== 'All' && c.category !== cat) return false;
      if (type !== 'All' && c.type !== type) return false;
      if (cost !== 'All' && c.cost !== cost) return false;
      if (needle) {
        const hay = `${c.name} ${c.subject} ${c.category} ${c.blurb}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    }).sort((a, b) => b.difficulty - a.difficulty);
  }, [q, cat, type, cost]);

  return (
    <div className="wrap" style={{ padding: '34px 24px 90px' }}>
      <h1 style={{ fontSize: 'clamp(28px,4vw,40px)' }}>Discover opportunities</h1>
      <p className="muted" style={{ marginTop: 8, fontSize: 16, maxWidth: 640 }}>
        Olympiads, research programs, competitions and scholarships worth your time —
        the same database the AI recommends from. Filter by field, format and cost.
      </p>

      {/* search */}
      <div style={{ marginTop: 24, position: 'relative', maxWidth: 460 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search — e.g. physics, research, essay, free…"
          style={{ paddingLeft: 40 }}
        />
        <span style={{ position: 'absolute', left: 14, top: 11, color: 'var(--faint)' }}>⌕</span>
      </div>

      {/* category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`pill ${cat === c ? '' : 'pill-muted'}`}
            style={{ cursor: 'pointer', border: 'none', fontSize: 13, padding: '6px 13px', background: cat === c ? 'var(--primary)' : undefined, color: cat === c ? '#fff' : undefined }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* secondary filters */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select label="Format" value={type} setValue={setType} options={TYPES} render={(t) => (t === 'All' ? 'All formats' : TYPE_LABEL[t])} />
        <Select label="Cost" value={cost} setValue={setCost} options={COSTS} render={(c) => (c === 'All' ? 'Any cost' : COST_META[c].label)} />
        <span className="muted" style={{ fontSize: 13.5, marginLeft: 'auto' }}>{list.length} results</span>
      </div>

      <div style={{ display: 'grid', gap: 14, marginTop: 22, gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))' }}>
        {list.map((c) => (
          <CompCard key={c.id} c={c} />
        ))}
      </div>

      {list.length === 0 && <p className="muted" style={{ marginTop: 30 }}>Nothing matches — try clearing a filter.</p>}
    </div>
  );
}

function CompCard({ c }) {
  const cost = COST_META[c.cost];
  return (
    <div className="card card-pad" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <span className="pill pill-muted" style={{ fontSize: 11.5 }}>{c.category}</span>
        <Difficulty n={c.difficulty} />
      </div>
      <h3 style={{ fontSize: 18, marginTop: 12, lineHeight: 1.2 }}>{c.name}</h3>
      <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{c.subject}</div>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 10, color: 'var(--ink)', flex: 1 }}>{c.blurb}</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
        <span className="pill band-target" style={{ fontSize: 11.5 }}>{TYPE_LABEL[c.type]}</span>
        <span className={`pill ${cost.cls}`} style={{ fontSize: 11.5 }}>{cost.label}</span>
        <span className="pill pill-muted" style={{ fontSize: 11.5, textTransform: 'capitalize' }}>{c.level}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: 12.5 }}>
          <div className="muted">Timing</div>
          <div style={{ fontWeight: 600 }}>{c.season}</div>
        </div>
        {c.link ? (
          <a
            href={c.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            onClick={() => track('opportunity_click', { id: c.id, name: c.name, category: c.category })}
          >
            Learn more ↗
          </a>
        ) : (
          <span className="pill pill-gold" style={{ fontSize: 11.5 }}>Self-started</span>
        )}
      </div>
    </div>
  );
}

function Difficulty({ n }) {
  return (
    <span title={`Difficulty ${n}/5`} style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ width: 6, height: 14, borderRadius: 2, background: i <= n ? 'var(--accent)' : 'var(--line)' }} />
      ))}
    </span>
  );
}

function Select({ label, value, setValue, options, render }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
      <span className="muted">{label}</span>
      <select value={value} onChange={(e) => setValue(e.target.value)} style={{ width: 'auto' }}>
        {options.map((o) => (
          <option key={o} value={o}>{render(o)}</option>
        ))}
      </select>
    </label>
  );
}
