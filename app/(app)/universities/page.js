'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/store';
import { UNIVERSITIES, RANK_TIERS, rankTier } from '@/lib/universities';
import { estimateChance, BAND_META } from '@/lib/chances';
import { profileBreakdown, completeness } from '@/lib/profile';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import { PageHead, Loading } from '@/components/ui';
import Icon from '@/components/Icon';

const BANDS = ['safety', 'target', 'reach', 'hard-reach'];
const PAGE = 24;
const POLICY_LABEL = {
  required: 'SAT/ACT required',
  optional: 'Test-optional',
  recommended: 'Tests recommended',
  'not-considered': 'Test-blind',
};
const COUNTRIES = [...new Set(UNIVERSITIES.map((u) => u.country))].sort((a, b) =>
  a === 'USA' ? -1 : b === 'USA' ? 1 : a.localeCompare(b)
);
const STATES = [...new Set(UNIVERSITIES.filter((u) => u.state).map((u) => u.state))].sort();
const DEFAULT_FILTERS = { q: '', tier: 'all', country: 'all', state: 'all', band: 'all', type: 'all', policy: 'all', mine: false, sort: 'rank' };

export default function UniversitiesPage() {
  const { t } = useT();
  const [p, update, ready] = usePortfolio();
  const [f, setF] = useState(DEFAULT_FILTERS);
  const [limit, setLimit] = useState(PAGE);
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    track('chances_view');
  }, []);
  useEffect(() => setLimit(PAGE), [f]);

  const complete = ready ? completeness(p) : 0;
  const strength = ready ? profileBreakdown(p).strength : 0;
  const all = useMemo(() => {
    if (!ready) return [];
    const bd = profileBreakdown(p);
    return UNIVERSITIES.map((u) => ({ u, est: estimateChance(p, u, bd) }));
  }, [p, ready]);

  const rows = useMemo(() => {
    const needle = f.q.trim().toLowerCase();
    const maxRank = RANK_TIERS.find((x) => x.id === f.tier)?.max ?? Infinity;
    const list = all.filter(({ u, est }) => {
      if (u.rank > maxRank) return false;
      if (needle && !`${u.name} ${u.location}`.toLowerCase().includes(needle)) return false;
      if (f.country !== 'all' && u.country !== f.country) return false;
      if (f.state !== 'all' && u.state !== f.state) return false;
      if (f.band !== 'all' && est.band !== f.band) return false;
      if (f.type !== 'all' && u.ownership !== f.type) return false;
      if (f.policy !== 'all' && (u.testPolicy || 'unknown') !== f.policy) return false;
      if (f.mine && !(p.shortlist || []).includes(u.id)) return false;
      return true;
    });
    const by = {
      rank: (a, b) => a.u.rank - b.u.rank,
      chance: (a, b) => b.est.chance - a.est.chance,
      rate: (a, b) => a.u.acceptRate - b.u.acceptRate,
      tuition: (a, b) => (a.u.tuition ?? 1e9) - (b.u.tuition ?? 1e9),
      intl: (a, b) => (b.u.intlShare ?? -1) - (a.u.intlShare ?? -1),
    }[f.sort];
    return [...list].sort(by);
  }, [all, f, p.shortlist]);

  const counts = useMemo(() => rows.reduce((acc, r) => ((acc[r.est.band] = (acc[r.est.band] || 0) + 1), acc), {}), [rows]);
  const active = Object.keys(DEFAULT_FILTERS).filter((k) => k !== 'sort' && f[k] !== DEFAULT_FILTERS[k]).length;

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

      {/* rank tiers — the main lens */}
      <div className="un-tiers" role="tablist" aria-label={t('Ranking')}>
        {[{ id: 'all', label: 'All' }, ...RANK_TIERS].map((x) => (
          <button key={x.id} role="tab" aria-selected={f.tier === x.id} className={f.tier === x.id ? 'on' : ''} onClick={() => set({ tier: x.id })}>
            {t(x.label)}
          </button>
        ))}
      </div>

      <div className="un-controls">
        <input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t('Search {n} universities — name or city', { n: UNIVERSITIES.length })} aria-label={t('Search universities')} />
        <select value={f.country} onChange={(e) => set({ country: e.target.value, state: 'all' })} aria-label={t('Country')}>
          <option value="all">{t('All countries')}</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{t(c)}</option>
          ))}
        </select>
        {(f.country === 'all' || f.country === 'USA') && (
          <select value={f.state} onChange={(e) => set({ state: e.target.value, country: e.target.value === 'all' ? f.country : 'USA' })} aria-label={t('State')}>
            <option value="all">{t('All states')}</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        <select value={f.band} onChange={(e) => set({ band: e.target.value })} aria-label={t('Band')}>
          <option value="all">{t('All bands')}</option>
          {BANDS.map((b) => (
            <option key={b} value={b}>{t(BAND_META[b].label)}</option>
          ))}
        </select>
        <select value={f.type} onChange={(e) => set({ type: e.target.value })} aria-label={t('Type')}>
          <option value="all">{t('Public and private')}</option>
          <option value="Public">{t('Public')}</option>
          <option value="Private">{t('Private')}</option>
        </select>
        <select value={f.policy} onChange={(e) => set({ policy: e.target.value })} aria-label={t('Test policy')}>
          <option value="all">{t('Any test policy')}</option>
          {Object.entries(POLICY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{t(v)}</option>
          ))}
        </select>
        <select value={f.sort} onChange={(e) => set({ sort: e.target.value })} aria-label={t('Sort')}>
          <option value="rank">{t('Sort: ranking')}</option>
          <option value="chance">{t('Sort: my chances')}</option>
          <option value="rate">{t('Sort: selectivity')}</option>
          <option value="tuition">{t('Sort: lowest tuition')}</option>
          <option value="intl">{t('Sort: most international')}</option>
        </select>
      </div>

      <div className="un-meta">
        <label>
          <input type="checkbox" checked={f.mine} onChange={(e) => set({ mine: e.target.checked })} />
          {t('Only my list ({n})', { n: mine })}
        </label>
        <span className="muted">{t('{n} shown', { n: rows.length })}</span>
        {BANDS.map((b) =>
          counts[b] ? (
            <span key={b} className={`pill band-${b}`}>
              {t(BAND_META[b].label)} · {counts[b]}
            </span>
          ) : null
        )}
        <span className="muted" style={{ marginLeft: 'auto' }}>{t('Profile strength')} {strength}/100</span>
        {active > 0 && (
          <button className="link" style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 13.5 }} onClick={() => setF(DEFAULT_FILTERS)}>
            {t('Reset filters')}
          </button>
        )}
      </div>

      <div className="uni-grid stagger">
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

      <p className="muted" style={{ fontSize: 12.5, marginTop: 28, lineHeight: 1.55, maxWidth: 760 }}>
        {t('Ranking is Folio’s selectivity index: 60% acceptance rate, 40% SAT of the admitted class — built from public data, not a commercial ranking. US data: U.S. Department of Education College Scorecard. Admitted GPA and English minimums for US schools are estimates. Odds are estimates, not guarantees.')}
      </p>

      <style>{`
        .un-tiers{display:flex; gap:6px; flex-wrap:wrap;}
        .un-tiers button{font:600 14px var(--sans); padding:9px 16px; border-radius:var(--r); border:1px solid var(--line-strong);
          background:var(--surface); color:var(--ink-2); cursor:pointer; transition:background .25s var(--ease), color .25s var(--ease), border-color .25s var(--ease), transform .2s var(--ease);}
        .un-tiers button:hover{border-color:var(--ink-2);}
        .un-tiers button.on{background:var(--ink); color:#fff; border-color:var(--ink);}
        .un-controls{display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;}
        .un-controls input{flex:2 1 240px;}
        .un-controls select{width:auto; flex:1 1 150px;}
        .un-meta{display:flex; gap:10px; align-items:center; margin-top:12px; flex-wrap:wrap; font-size:13.5px;}
        .un-meta label{display:flex; gap:8px; align-items:center; cursor:pointer;}
        .uni-grid{display:grid; gap:14px; margin-top:16px; grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));}
        .un-rank{display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:700; color:var(--ink-2);}
        .un-rank b{font-family:var(--display); font-weight:400; font-size:15px;}
        .un-top{background:var(--ink); color:#fff; padding:2px 7px; border-radius:6px; font-size:11px;}
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

function fmtMoney(n) {
  return n ? `$${Math.round(n / 1000)}k` : null;
}

function UniCard({ u, est, saved, onToggleSave }) {
  const { t } = useT();
  const meta = BAND_META[est.band];
  const tier = rankTier(u.rank);
  const [open, setOpen] = useState(false);
  return (
    <div className="card card-hover" style={{ padding: 18 }}>
      <div className="un-rank">
        <b>#{u.rank}</b>
        {tier && tier.max <= 50 && <span className="un-top">{t(tier.label)}</span>}
        <span className="muted" style={{ fontWeight: 500 }}>{u.location} · {t(u.country)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
        <h3 style={{ fontSize: 17, minWidth: 0 }}>{u.name}</h3>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: meta.color, lineHeight: 1 }}>{est.chance}%</div>
          <span className={`pill band-${est.band}`} style={{ marginTop: 6 }}>{t(meta.label)}</span>
        </div>
      </div>

      <div className="bar" style={{ marginTop: 12 }}>
        <span style={{ width: `${est.chance}%`, background: meta.color }} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        <span className="pill pill-muted">{t('Admit rate {n}%', { n: u.acceptRate })}</span>
        {u.satMid ? <span className="pill pill-muted">SAT {u.satMid[0]}–{u.satMid[1]}</span> : null}
        {u.testPolicy && <span className="pill pill-muted">{t(POLICY_LABEL[u.testPolicy])}</span>}
        {u.intlShare != null && <span className="pill pill-muted">{t('{n}% international', { n: u.intlShare })}</span>}
        {fmtMoney(u.tuition) && <span className="pill pill-muted">{t('{n}/yr tuition', { n: fmtMoney(u.tuition) })}</span>}
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
          <ul className="stagger" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {est.reasons.map((r, i) => (
              <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13.5, lineHeight: 1.5 }}>
                <span
                  aria-hidden
                  style={{ marginTop: 6, width: 7, height: 7, flex: '0 0 auto', borderRadius: 999, background: r.tone === 'good' ? 'var(--good)' : r.tone === 'bad' ? 'var(--bad)' : 'var(--line-strong)' }}
                />
                <span>{t(r.text, r.vars)}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            <FactorBar label={t('Grades vs. admits')} v={est.factors.gpaFit} />
            {u.satMid && u.testPolicy !== 'not-considered' && <FactorBar label={t('Test score vs. admits')} v={est.factors.testFit} />}
            <FactorBar label={t('Activities & awards vs. admits')} v={est.factors.ecFit} />
          </div>
          {u.blurb && <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 12 }}>{u.blurb}</p>}
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            {t('Source: {src}', { src: u.source || 'Folio' })}
            {(u.derived || []).includes('gpaAvg') ? ` · ${t('GPA and English minimum are estimates')}` : ''}
            {u.url && (
              <>
                {' · '}
                <a href={u.url} target="_blank" rel="noopener noreferrer" className="link">{t('Official site')} ↗</a>
              </>
            )}
          </p>
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
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: pos ? 'var(--good)' : 'var(--bad)', transition: 'width .6s var(--ease)' }} />
      </div>
    </div>
  );
}
