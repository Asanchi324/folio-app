'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/store';
import { UNIVERSITIES } from '@/lib/universities';
import { estimateChance, BAND_META } from '@/lib/chances';
import { profileBreakdown, completeness } from '@/lib/profile';
import { track } from '@/lib/analytics';

const COUNTRIES = ['All', 'USA', 'UK', 'Canada'];
const BANDS = ['All', 'safety', 'target', 'reach', 'hard-reach'];

export default function UniversitiesPage() {
  const [p, , ready] = usePortfolio();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('All');
  const [band, setBand] = useState('All');
  const [sort, setSort] = useState('chance');

  useEffect(() => {
    track('chances_view');
  }, []);

  const complete = ready ? completeness(p) : 0;
  const strength = ready ? profileBreakdown(p).strength : 0;

  const rows = useMemo(() => {
    if (!ready) return [];
    let list = UNIVERSITIES.map((u) => ({ u, est: estimateChance(p, u) }));
    const needle = q.trim().toLowerCase();
    if (needle) list = list.filter((r) => `${r.u.name} ${r.u.location}`.toLowerCase().includes(needle));
    if (country !== 'All') list = list.filter((r) => r.u.country === country);
    if (band !== 'All') list = list.filter((r) => r.est.band === band);
    list.sort((a, b) => {
      if (sort === 'chance') return b.est.chance - a.est.chance;
      if (sort === 'selectivity') return a.u.acceptRate - b.u.acceptRate;
      return a.u.rank - b.u.rank;
    });
    return list;
  }, [p, ready, q, country, band, sort]);

  const counts = useMemo(() => {
    if (!ready) return {};
    const all = UNIVERSITIES.map((u) => estimateChance(p, u).band);
    return all.reduce((acc, b) => ((acc[b] = (acc[b] || 0) + 1), acc), {});
  }, [p, ready]);

  return (
    <div className="wrap" style={{ padding: '34px 24px 90px' }}>
      <h1 style={{ fontSize: 'clamp(28px,4vw,40px)' }}>Where do you stand?</h1>
      <p className="muted" style={{ marginTop: 8, fontSize: 16, maxWidth: 640 }}>
        Live admission odds based on your portfolio — not wishful thinking. Update your
        portfolio and these recalculate instantly.
      </p>

      {ready && complete < 40 && (
        <div
          className="card"
          style={{ marginTop: 20, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'var(--warn-tint)', border: '1px solid #f0d8b0' }}
        >
          <span style={{ fontSize: 14.5, color: '#8a5a13' }}>
            Your portfolio is only {complete}% complete — these estimates will get much more accurate as you fill it in.
          </span>
          <Link href="/portfolio" className="btn btn-gold btn-sm">Complete portfolio</Link>
        </div>
      )}

      {/* summary band counts */}
      <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
        <Stat label="Profile strength" value={`${strength}/100`} />
        {['safety', 'target', 'reach', 'hard-reach'].map((b) => (
          <Stat key={b} label={BAND_META[b].label} value={counts[b] || 0} color={BAND_META[b].color} />
        ))}
      </div>

      {/* search */}
      <div style={{ marginTop: 22, position: 'relative', maxWidth: 420 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${UNIVERSITIES.length} universities — e.g. Boston, California…`}
          style={{ paddingLeft: 38 }}
        />
        <span style={{ position: 'absolute', left: 13, top: 11, color: 'var(--faint)' }}>⌕</span>
      </div>

      {/* filters */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter
          label="Country"
          value={country}
          setValue={setCountry}
          options={COUNTRIES.map((c) => ({ v: c, label: c }))}
        />
        <Filter
          label="Band"
          value={band}
          setValue={setBand}
          options={BANDS.map((b) => ({ v: b, label: b === 'All' ? 'All' : BAND_META[b].label }))}
        />
        <span className="muted" style={{ fontSize: 13 }}>{rows.length} shown</span>
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
          <span className="muted">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto' }}>
            <option value="chance">By my chances</option>
            <option value="rank">By ranking</option>
            <option value="selectivity">By selectivity</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gap: 14, marginTop: 22, gridTemplateColumns: 'repeat(auto-fill, minmax(330px,1fr))' }}>
        {rows.map(({ u, est }) => (
          <UniCard key={u.id} u={u} est={est} />
        ))}
      </div>

      {ready && rows.length === 0 && (
        <p className="muted" style={{ marginTop: 30 }}>No universities match these filters.</p>
      )}
    </div>
  );
}

function UniCard({ u, est }) {
  const meta = BAND_META[est.band];
  const [open, setOpen] = useState(false);
  return (
    <div className="card card-pad" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 19, lineHeight: 1.15 }}>{u.name}</h3>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{u.location} · {u.country}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 30, fontWeight: 600, color: meta.color, lineHeight: 1 }}>
            {est.chance}%
          </div>
          <span className={`pill band-${est.band}`} style={{ marginTop: 6 }}>{meta.label}</span>
        </div>
      </div>

      <div style={{ height: 8, borderRadius: 999, background: 'var(--line)', marginTop: 14, overflow: 'hidden' }}>
        <div style={{ width: `${est.chance}%`, height: '100%', background: meta.color, transition: 'width .5s ease' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        <Tag>Accept {u.acceptRate}%</Tag>
        <Tag>SAT {u.satMid[0]}–{u.satMid[1]}</Tag>
        <Tag>IELTS {u.ieltsMin}+</Tag>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost btn-sm"
        style={{ marginTop: 14, width: '100%' }}
      >
        {open ? 'Hide details' : 'Why this number?'}
      </button>

      {open && (
        <div className="fade-in" style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.55 }}>{u.blurb}</p>

          {est.reasons?.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'grid', gap: 9 }}>
              {est.reasons.map((r, i) => (
                <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13, lineHeight: 1.5 }}>
                  <span
                    aria-hidden
                    style={{
                      marginTop: 5,
                      width: 7,
                      height: 7,
                      flex: '0 0 auto',
                      borderRadius: 999,
                      background:
                        r.tone === 'good' ? 'var(--good)' : r.tone === 'bad' ? 'var(--bad)' : 'var(--line-strong)',
                    }}
                  />
                  <span>{r.text}</span>
                </li>
              ))}
            </ul>
          )}

          <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
            <FactorBar label="Academic fit (GPA)" v={est.factors.gpaFit} />
            <FactorBar label="Test fit" v={est.factors.testFit} />
            <FactorBar label="Overall profile" v={est.factors.strengthFit} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {u.tags.map((t) => (
              <span key={t} className="pill pill-muted" style={{ fontSize: 11.5 }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FactorBar({ label, v }) {
  const pct = ((Math.max(-1, Math.min(1, v)) + 1) / 2) * 100;
  const pos = v >= 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span>{label}</span>
        <span style={{ color: pos ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>
          {pos ? 'above' : 'below'} their average
        </span>
      </div>
      <div style={{ position: 'relative', height: 6, borderRadius: 999, background: 'var(--line)', marginTop: 5 }}>
        <div style={{ position: 'absolute', left: '50%', top: -2, width: 1, height: 10, background: 'var(--line-strong)' }} />
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: pos ? 'var(--good)' : 'var(--bad)' }} />
      </div>
    </div>
  );
}

function Tag({ children }) {
  return <span className="pill pill-muted" style={{ fontSize: 12 }}>{children}</span>;
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '12px 18px', minWidth: 110 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 600, color: color || 'var(--ink)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Filter({ label, value, setValue, options }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
      <span className="muted">{label}</span>
      <select value={value} onChange={(e) => setValue(e.target.value)} style={{ width: 'auto' }}>
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
