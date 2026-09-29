'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/store';
import { UNIVERSITIES } from '@/lib/universities';
import { estimateChance, BAND_META } from '@/lib/chances';
import { profileBreakdown, completeness } from '@/lib/profile';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import { PageHead, Loading } from '@/components/ui';
import Icon from '@/components/Icon';

const COUNTRIES = ['All', 'USA', 'UK', 'Canada'];
const BANDS = ['All', 'safety', 'target', 'reach', 'hard-reach'];
const PAGE = 24;

export default function UniversitiesPage() {
  const { t } = useT();
  const [p, update, ready] = usePortfolio();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('All');
  const [band, setBand] = useState('All');
  const [sort, setSort] = useState('chance');
  const [onlyMine, setOnlyMine] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    track('chances_view');
  }, []);
  useEffect(() => setLimit(PAGE), [q, country, band, sort, onlyMine]);

  const complete = ready ? completeness(p) : 0;
  const strength = ready ? profileBreakdown(p).strength : 0;

  const all = useMemo(() => (ready ? UNIVERSITIES.map((u) => ({ u, est: estimateChance(p, u) })) : []), [p, ready]);

  const rows = useMemo(() => {
    let list = all;
    const needle = q.trim().toLowerCase();
    if (needle) list = list.filter((r) => `${r.u.name} ${r.u.location}`.toLowerCase().includes(needle));
    if (country !== 'All') list = list.filter((r) => r.u.country === country);
    if (band !== 'All') list = list.filter((r) => r.est.band === band);
    if (onlyMine) list = list.filter((r) => (p.shortlist || []).includes(r.u.id));
    return [...list].sort((a, b) => {
      if (sort === 'chance') return b.est.chance - a.est.chance;
      if (sort === 'selectivity') return a.u.acceptRate - b.u.acceptRate;
      return a.u.rank - b.u.rank;
    });
  }, [all, q, country, band, sort, onlyMine, p.shortlist]);

  const counts = useMemo(() => all.reduce((acc, r) => ((acc[r.est.band] = (acc[r.est.band] || 0) + 1), acc), {}), [all]);

  if (!ready) return <Loading />;
  const mine = (p.shortlist || []).length;

  return (
    <div className="page">
      <PageHead
        title={t('Universities')}
        sub={t('Admission odds calculated from your portfolio against each school’s admitted class. Change your portfolio and they update instantly.')}
      />

      {complete < 40 && (
        <div className="notice notice-warn" style={{ marginBottom: 18, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span>{t('Your portfolio is {n}% complete — these estimates get much more accurate as you fill it in.', { n: complete })}</span>
          <Link href="/portfolio" className="btn btn-ghost btn-sm">{t('Complete portfolio')}</Link>
        </div>
      )}

      <div className="uni-stats">
        <Stat label={t('Profile strength')} value={`${strength}/100`} />
        {['safety', 'target', 'reach', 'hard-reach'].map((b) => (
          <Stat key={b} label={t(BAND_META[b].label)} value={counts[b] || 0} color={BAND_META[b].color} />
        ))}
      </div>

      <div className="uni-controls">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('Search {n} universities — name or city', { n: UNIVERSITIES.length })}
          aria-label={t('Search universities')}
          style={{ flex: '2 1 240px' }}
        />
        <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t('Country')}>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{c === 'All' ? t('All countries') : c}</option>
          ))}
        </select>
        <select value={band} onChange={(e) => setBand(e.target.value)} aria-label={t('Band')}>
          {BANDS.map((b) => (
            <option key={b} value={b}>{b === 'All' ? t('All bands') : t(BAND_META[b].label)}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('Sort')}>
          <option value="chance">{t('Sort: my chances')}</option>
          <option value="rank">{t('Sort: ranking')}</option>
          <option value="selectivity">{t('Sort: selectivity')}</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          {t('Only my list ({n})', { n: mine })}
        </label>
        <span className="muted" style={{ fontSize: 13.5 }}>{t('{n} shown', { n: rows.length })}</span>
        {mine > 0 && (
          <Link href="/deadlines" className="link" style={{ fontSize: 13.5, marginLeft: 'auto' }}>
            {t('Deadlines for my list')} →
          </Link>
        )}
      </div>

      <div className="uni-grid">
        {rows.slice(0, limit).map(({ u, est }) => (
          <UniCard key={u.id} u={u} est={est} saved={(p.shortlist || []).includes(u.id)} onToggleSave={() => toggleShortlist(u.id, update)} />
        ))}
      </div>
      {rows.length > limit && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
            {t('Show more ({n} left)', { n: rows.length - limit })}
          </button>
        </div>
      )}
      {rows.length === 0 && <p className="muted" style={{ marginTop: 30 }}>{t('No universities match these filters.')}</p>}

      <p className="muted" style={{ fontSize: 12.5, marginTop: 28, lineHeight: 1.55, maxWidth: 720 }}>
        {t('Estimates, not guarantees. Based on published acceptance rates and mid-50% test ranges (College Scorecard and university data); top schools are capped because beyond a point admission is unpredictable.')}
      </p>

      <style>{`
        .uni-stats{display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px;}
        .uni-controls{display:flex; gap:10px; margin-top:18px; flex-wrap:wrap;}
        .uni-controls select{width:auto; flex:1 1 150px;}
        .uni-grid{display:grid; gap:14px; margin-top:18px; grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));}
        @media (max-width:700px){ .uni-stats{grid-template-columns:repeat(3,minmax(0,1fr));} }
      `}</style>
    </div>
  );
}

function toggleShortlist(id, update) {
  update((prev) => {
    const list = prev.shortlist || [];
    return { ...prev, shortlist: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
  });
  track('shortlist_toggle', { id });
}

function UniCard({ u, est, saved, onToggleSave }) {
  const { t } = useT();
  const meta = BAND_META[est.band];
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 17 }}>{u.name}</h3>
          <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{u.location} · {u.country}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: meta.color, lineHeight: 1 }}>{est.chance}%</div>
          <span className={`pill band-${est.band}`} style={{ marginTop: 6 }}>{t(meta.label)}</span>
        </div>
      </div>

      <div style={{ height: 6, borderRadius: 999, background: 'var(--line)', marginTop: 14, overflow: 'hidden' }}>
        <div style={{ width: `${est.chance}%`, height: '100%', background: meta.color, transition: 'width .4s ease' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        <span className="pill pill-muted">{t('Admit rate {n}%', { n: u.acceptRate })}</span>
        <span className="pill pill-muted">SAT {u.satMid[0]}–{u.satMid[1]}</span>
        <span className="pill pill-muted">IELTS {u.ieltsMin}+</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={onToggleSave}
          aria-pressed={saved}
          className="btn btn-sm btn-ghost"
          style={{ flex: 1, borderColor: saved ? 'var(--primary)' : undefined, color: saved ? 'var(--primary-600)' : undefined }}
        >
          <Icon name="star" size={15} /> {saved ? t('On my list') : t('Add to my list')}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="btn btn-ghost btn-sm" style={{ flex: 1 }} aria-expanded={open}>
          {open ? t('Hide details') : t('Why this number?')}
        </button>
      </div>

      {open && (
        <div className="fade-in" style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {est.reasons.map((r, i) => (
              <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13.5, lineHeight: 1.5 }}>
                <span
                  aria-hidden
                  style={{
                    marginTop: 6,
                    width: 7,
                    height: 7,
                    flex: '0 0 auto',
                    borderRadius: 999,
                    background: r.tone === 'good' ? 'var(--good)' : r.tone === 'bad' ? 'var(--bad)' : 'var(--line-strong)',
                  }}
                />
                <span>{t(r.text, r.vars)}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            <FactorBar label={t('Grades vs. admits')} v={est.factors.gpaFit} />
            <FactorBar label={t('Test score vs. admits')} v={est.factors.testFit} />
            <FactorBar label={t('Activities & awards vs. admits')} v={est.factors.ecFit} />
          </div>
          {u.blurb && <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 12 }}>{u.blurb}</p>}
        </div>
      )}
    </div>
  );
}

function FactorBar({ label, v }) {
  const { t } = useT();
  const pct = ((Math.max(-1, Math.min(1, v)) + 1) / 2) * 100;
  const pos = v >= 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, gap: 8 }}>
        <span>{label}</span>
        <span style={{ color: pos ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>{pos ? t('above typical') : t('below typical')}</span>
      </div>
      <div style={{ position: 'relative', height: 6, borderRadius: 999, background: 'var(--line)', marginTop: 5 }}>
        <div style={{ position: 'absolute', left: '50%', top: -2, width: 1, height: 10, background: 'var(--line-strong)' }} />
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: pos ? 'var(--good)' : 'var(--bad)' }} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="card" style={{ padding: '10px 14px', minWidth: 0 }}>
      <div className="muted" style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 21, color: color || 'var(--ink)', marginTop: 2 }}>{value}</div>
    </div>
  );
}
