'use client';

// Student profile — one read-only renderer, four consumers:
//   • the student's own profile (/profile) — `editable`: pencils, empty-state
//     prompts and inline editing of target universities
//   • counselor's student view (/counselor/student/[uid])
//   • public share page (/p/[shareId])
// Options control which sections render (the share flow lets the student
// curate). Layout: hero → links → academic performance → target
// universities → extracurriculars → honors → narrative → strength.

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Ring from '@/components/Ring';
import Icon from '@/components/Icon';
import { profileBreakdown, strengthTier } from '@/lib/profile';
import { autoHeadline, avatarColor, initials, linkInfo } from '@/lib/profile-card';
import { useT } from '@/lib/i18n';

const LEVEL_LABEL = { school: 'School', regional: 'Regional', state: 'State', national: 'National', international: 'International' };

const DEFAULT_OPTS = {
  strength: true,
  academics: true,
  testing: true,
  activities: true,
  honors: true,
  targets: true,
  links: true,
  narrative: false, // essays are private by default
};

const TARGETS_FOLDED = 5;
const ACTS_FOLDED = 4;

export default function PortfolioView({ p, options, precomputed, targets: targetsProp, editable = false, onTargetsChange }) {
  const { t: tr } = useT();
  const opts = { ...DEFAULT_OPTS, ...(options || {}) };
  // Share snapshots carry the strength computed at publish time (the snapshot
  // may omit sections, which would skew a live recompute).
  const { strength, pillars } = precomputed || profileBreakdown(p || {});
  const acts = (p?.activities || []).filter((x) => x.position || x.organization || x.description);
  const honors = (p?.honors || []).filter((h) => String(h.title || '').trim());
  const targets = targetsProp || p?.targets || [];
  const links = (p?.links || []).map(linkInfo).filter(Boolean);

  const headline =
    String(p?.headline || '').trim() ||
    autoHeadline({ intendedMajor: p?.intendedMajor, targets: orderTop(targets, p?.topChoice).map((u) => u.name) }, tr);

  const showTargets = opts.targets && (targets.length > 0 || editable);
  const showLinks = opts.links && (links.length > 0 || editable);

  return (
    <div className="pv stagger">
      <Hero p={p} headline={headline} strength={opts.strength ? strength : null} editable={editable} />

      {showLinks && (
        <section className="pv-card">
          <Head title={tr('Links')} count={links.length} edit={editable && '/portfolio#links'} editLabel={tr('Edit links')} />
          {links.length ? (
            <div className="pv-links">
              {links.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="pv-link">
                  <span className="pv-link-ic">
                    <Icon name={l.kind === 'website' ? 'globe' : l.kind} size={19} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="pv-link-label">{tr(l.label)}</span>
                    <span className="pv-link-host">{l.display}</span>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <Empty href="/portfolio#links" text={tr('Add LinkedIn, Telegram or your site — so people who like your profile can reach you.')} cta={tr('Add links')} />
          )}
        </section>
      )}

      {opts.academics && <Academics p={p} showTests={opts.testing} editable={editable} />}

      {showTargets && (
        <Targets targets={targets} topChoice={p?.topChoice} editable={editable} onChange={onTargetsChange} />
      )}

      {opts.activities && (acts.length > 0 || editable) && (
        <section className="pv-card">
          <Head title={tr('Extracurriculars')} count={acts.length} edit={editable && '/portfolio#activities'} editLabel={tr('Edit extracurriculars')} />
          {acts.length ? <Activities acts={acts} /> : (
            <Empty href="/portfolio#activities" text={tr('Clubs, research, projects, jobs, volunteering — your activities are half of an application.')} cta={tr('Add an activity')} />
          )}
        </section>
      )}

      {opts.honors && (honors.length > 0 || editable) && (
        <section className="pv-card">
          <Head title={tr('Honors & awards')} count={honors.length} edit={editable && '/portfolio#honors'} editLabel={tr('Edit honors')} />
          {honors.length ? (
            <ul className="pv-rows">
              {honors.map((h, i) => {
                const high = h.level === 'international' || h.level === 'national';
                return (
                  <li key={h.id || i} className="pv-honor">
                    <span className={`pv-honor-ic${high ? ' gold' : ''}`}>
                      <Icon name="medal" size={18} />
                    </span>
                    <span className="pv-honor-title">{h.title}</span>
                    <span className={`pill ${high ? 'pill-gold' : 'pill-muted'}`} style={{ flexShrink: 0 }}>
                      {tr(LEVEL_LABEL[h.level] || h.level || '')}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty href="/portfolio#honors" text={tr('Olympiads, competitions, scholarships — include the result and the level.')} cta={tr('Add an honor')} />
          )}
        </section>
      )}

      {opts.narrative && (p?.narrative?.spike || p?.narrative?.personalStatement) && <Narrative n={p.narrative} />}

      {opts.strength && pillars?.length > 0 && (
        <section className="pv-card">
          <Head title={tr('Profile pillars')} />
          <div className="pv-pillars">
            {pillars.map((pl) => (
              <div key={pl.key}>
                <div className="pv-pillar-top">
                  <span>{tr(pl.label)}</span>
                  <b>{pl.score}</b>
                </div>
                <div className="bar" style={{ marginTop: 6 }}>
                  <span style={{ width: `${pl.score}%`, background: 'var(--primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <style>{CSS}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero({ p, headline, strength, editable }) {
  const { t: tr } = useT();
  const name = p?.fullName || tr('Unnamed student');
  const meta = [
    p?.gradeLevel && (p.gradeLevel === 'gap' ? tr('Gap year') : tr('Grade {n}', { n: p.gradeLevel })),
    p?.country,
  ].filter(Boolean);
  const color = strength == null ? null : strength >= 75 ? 'var(--good)' : strength >= 50 ? 'var(--primary)' : strength >= 30 ? 'var(--warn)' : 'var(--bad)';
  return (
    <section className="pv-card pv-hero">
      <div className="pv-cover" aria-hidden />
      {editable && <EditLink href="/portfolio#basics" label={tr('Edit basics')} className="pv-hero-edit" />}
      <div className="pv-hero-body">
        <div className="pv-avatar" style={{ background: avatarColor(name) }} aria-hidden>
          {initials(name)}
        </div>
        <div className="pv-hero-row">
          <div className="pv-hero-main">
            <h2 className="pv-name">{name}</h2>
            {headline ? <p className="pv-headline">{headline}</p> : editable ? (
              <p className="pv-headline muted">{tr('Add your intended major and target universities — your headline builds itself.')}</p>
            ) : null}
            {meta.length > 0 && (
              <p className="pv-meta">
                {meta.map((m, i) => (
                  <span key={i}>{m}</span>
                ))}
              </p>
            )}
            {(p?.intendedMajor || (p?.targetCountries || []).length > 0) && (
              <div className="pv-chips">
                {p?.intendedMajor && (
                  <span className="pv-chip pv-chip-major">
                    <Icon name="student" size={14} /> {p.intendedMajor}
                  </span>
                )}
                {(p?.targetCountries || []).map((c) => (
                  <span key={c} className="pv-chip">{tr(c)}</span>
                ))}
              </div>
            )}
          </div>
          {strength != null && (
            <div className="pv-strength">
              <Ring value={strength} size={68} stroke={7} color={color} label={strength} />
              <div>
                <div className="pv-strength-label">{tr('Profile strength')}</div>
                <div className="pv-strength-tier">{tr(strengthTier(strength))}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ academics */

function Academics({ p, showTests, editable }) {
  const { t: tr } = useT();
  const a = p?.academics || {};
  const t = p?.testing || {};
  const tiles = [];
  if (a.gpa) {
    const scale = String(a.gpaScale || '4');
    tiles.push({ k: 'gpa', label: 'GPA', value: a.gpa, max: scale === '100' ? '100' : `${scale}.0` });
  }
  if (showTests) {
    if (t.sat) tiles.push({ k: 'sat', label: 'SAT', value: t.sat, max: '1600' });
    if (t.act) tiles.push({ k: 'act', label: 'ACT', value: t.act, max: '36' });
    if (t.ielts) tiles.push({ k: 'ielts', label: 'IELTS', value: fmtBand(t.ielts), max: '9.0' });
    if (t.toefl) tiles.push({ k: 'toefl', label: 'TOEFL', value: t.toefl, max: '120' });
  }
  const rank = String(a.classRank || '').match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
  if (rank) tiles.push({ k: 'rank', label: tr('Class rank'), value: rank[1], max: rank[2] });
  const aps = showTests ? (t.apScores || []).filter((x) => x.subject) : [];

  if (!tiles.length && !aps.length && !a.rigor && !editable) return null;

  return (
    <section className="pv-card">
      <Head title={tr('Academic performance')} count={tiles.length} edit={editable && '/portfolio#academics'} editLabel={tr('Edit academics')} />
      {tiles.length > 0 ? (
        <div className="pv-stats">
          {tiles.map((x) => (
            <div key={x.k} className="pv-stat">
              <div className="pv-stat-label">{x.label}</div>
              <div className="pv-stat-value">
                {x.value}
                <span className="pv-stat-max"> / {x.max}</span>
              </div>
            </div>
          ))}
        </div>
      ) : editable ? (
        <Empty href="/portfolio#academics" text={tr('Add your GPA and test scores — they show here as clean score cards.')} cta={tr('Add scores')} />
      ) : null}
      {aps.length > 0 && (
        <div className="pv-aps">
          {aps.map((x) => (
            <span key={x.id || x.subject} className="pv-ap">
              {x.subject} <b>{x.score || '—'}</b>
            </span>
          ))}
        </div>
      )}
      {a.rigor && (
        <p className="pv-rigor">
          <span>{tr('Course rigor')}:</span> {a.rigor}
        </p>
      )}
    </section>
  );
}

function fmtBand(v) {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n.toFixed(1) : v;
}

/* --------------------------------------------------- target universities */

function orderTop(list, topChoice) {
  if (!topChoice) return list;
  const top = list.find((u) => u.id === topChoice);
  return top ? [top, ...list.filter((u) => u.id !== topChoice)] : list;
}

function Targets({ targets, topChoice, editable, onChange }) {
  const { t: tr } = useT();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [justStarred, setJustStarred] = useState(null);
  const listRef = useRef(null);
  const flip = useRef(null);
  const canEdit = editable && typeof onChange === 'function';

  // FLIP: rows glide to their new place after a reorder instead of jumping.
  useLayoutEffect(() => {
    const before = flip.current;
    flip.current = null;
    if (!before || !listRef.current) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    listRef.current.querySelectorAll('[data-id]').forEach((el) => {
      const prev = before[el.dataset.id];
      if (prev == null) return;
      const dy = prev - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) return;
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.22, 0.8, 0.24, 1)' });
    });
  });

  const measure = () => {
    const pos = {};
    listRef.current?.querySelectorAll('[data-id]').forEach((el) => {
      pos[el.dataset.id] = el.getBoundingClientRect().top;
    });
    flip.current = pos;
  };

  const ids = targets.map((u) => u.id);
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    measure();
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ shortlist: next, topChoice });
  };
  const remove = (id) => {
    measure();
    onChange({ shortlist: ids.filter((x) => x !== id), topChoice: topChoice === id ? null : topChoice });
  };
  const star = (id) => {
    const next = topChoice === id ? null : id;
    setJustStarred(next);
    onChange({ shortlist: ids, topChoice: next });
  };

  const shown = editing || open ? targets : targets.slice(0, TARGETS_FOLDED);
  const hidden = targets.length - TARGETS_FOLDED;

  return (
    <section className="pv-card">
      <Head
        title={tr('Target universities')}
        count={targets.length}
        onEdit={canEdit && targets.length > 0 ? () => setEditing((v) => !v) : null}
        editing={editing}
        editLabel={tr('Edit target universities')}
        edit={editable && !canEdit && '/universities'}
      />
      {targets.length === 0 ? (
        <Empty href="/universities" text={tr('Pick the universities you are aiming for — they appear here, ranked, with your top choice marked.')} cta={tr('Choose universities')} />
      ) : (
        <>
          {editing && <p className="pv-edit-hint fade-in">{tr('Reorder with the arrows, star your top choice.')}</p>}
          <ol className="pv-targets" ref={listRef}>
            {shown.map((u, i) => {
              const top = u.id === topChoice;
              return (
                <li key={u.id} data-id={u.id} className={`pv-target${i >= TARGETS_FOLDED && !editing ? ' pv-reveal' : ''}`}>
                  <span className="pv-num">{i + 1}</span>
                  <span className="pv-tname">
                    {u.name}
                    {u.location && <span className="pv-tloc">{u.location}</span>}
                  </span>
                  {top && !editing && (
                    <span className={`pv-top${justStarred === u.id ? ' pop' : ''}`}>
                      <Star /> {tr('Top choice')}
                    </span>
                  )}
                  {editing && (
                    <span className="pv-tctl fade-in">
                      <button
                        type="button"
                        className={`pv-ic-btn${top ? ' on' : ''}`}
                        onClick={() => star(u.id)}
                        aria-pressed={top}
                        aria-label={top ? tr('Unmark top choice') : tr('Mark as top choice')}
                        title={top ? tr('Unmark top choice') : tr('Mark as top choice')}
                      >
                        <Star filled={top} />
                      </button>
                      <button type="button" className="pv-ic-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={tr('Move up')} title={tr('Move up')}>
                        ↑
                      </button>
                      <button type="button" className="pv-ic-btn" onClick={() => move(i, 1)} disabled={i === targets.length - 1} aria-label={tr('Move down')} title={tr('Move down')}>
                        ↓
                      </button>
                      <button type="button" className="pv-ic-btn" onClick={() => remove(u.id)} aria-label={tr('Remove')} title={tr('Remove')}>
                        <Icon name="close" size={15} />
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          {editing ? (
            <div className="pv-edit-foot fade-in">
              <Link href="/universities" className="btn btn-ghost btn-sm">
                <Icon name="plus" size={15} /> {tr('Add universities')}
              </Link>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing(false)}>
                {tr('Done')}
              </button>
            </div>
          ) : (
            hidden > 0 && (
              <button type="button" className="pv-more" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                {open ? tr('Show less') : tr('Show {n} more', { n: hidden })}
                <Icon name="chevron" size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s var(--ease)' }} />
              </button>
            )
          )}
        </>
      )}
    </section>
  );
}

function Star({ filled = true }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="pv-star">
      <path
        d="M12 3.6l2.5 5.1 5.6.8-4 3.9 1 5.6L12 16.4 7 19l1-5.6-4-3.9 5.5-.8L12 3.6Z"
        fill={filled ? '#e9a816' : 'none'}
        stroke={filled ? '#e9a816' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------- activities */

function Activities({ acts }) {
  const { t: tr } = useT();
  const [open, setOpen] = useState(false);
  const shown = open ? acts : acts.slice(0, ACTS_FOLDED);
  const hidden = acts.length - ACTS_FOLDED;
  return (
    <>
      <ul className="pv-rows">
        {shown.map((x, i) => (
          <li key={x.id || i} className={`pv-act${i >= ACTS_FOLDED ? ' pv-reveal' : ''}`}>
            <span className="pv-act-ic">
              <Icon name="bolt" size={17} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="pv-act-title">{x.position || tr('Member')}</div>
              {x.organization && <div className="pv-act-org">{x.organization}</div>}
              {x.description && <p className="pv-act-desc">{x.description}</p>}
              {(x.years || x.hours) && (
                <div className="pv-act-meta">
                  {[x.years && tr('{n} yr', { n: x.years }), x.hours && tr('{n} hrs/wk', { n: x.hours })].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" className="pv-more" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? tr('Show less') : tr('Show {n} more', { n: hidden })}
          <Icon name="chevron" size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s var(--ease)' }} />
        </button>
      )}
    </>
  );
}

/* --------------------------------------------------------- narrative */

function Narrative({ n }) {
  const { t: tr } = useT();
  const [open, setOpen] = useState(false);
  const ps = String(n.personalStatement || '');
  const long = ps.length > 600;
  return (
    <section className="pv-card">
      <Head title={tr('Narrative')} />
      {n.spike && (
        <blockquote className="pv-spike">
          <span>{tr('Spike')}</span>
          {n.spike}
        </blockquote>
      )}
      {ps && (
        <>
          <p className="pv-ps">{long && !open ? `${ps.slice(0, 600).trim()}…` : ps}</p>
          {long && (
            <button type="button" className="pv-more" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {open ? tr('Show less') : tr('Read the full draft')}
              <Icon name="chevron" size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s var(--ease)' }} />
            </button>
          )}
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ pieces */

function Head({ title, count, edit, onEdit, editing, editLabel }) {
  return (
    <div className="pv-head">
      <h3>
        {title}
        {count != null && <span className="pv-count"> ({count})</span>}
      </h3>
      {onEdit ? (
        <button type="button" className={`pv-edit${editing ? ' on' : ''}`} onClick={onEdit} aria-label={editLabel} aria-pressed={!!editing} title={editLabel}>
          <Icon name={editing ? 'check' : 'pen'} size={17} />
        </button>
      ) : edit ? (
        <EditLink href={edit} label={editLabel} />
      ) : null}
    </div>
  );
}

function EditLink({ href, label, className = '' }) {
  return (
    <Link href={href} className={`pv-edit ${className}`} aria-label={label} title={label}>
      <Icon name="pen" size={17} />
    </Link>
  );
}

function Empty({ href, text, cta }) {
  return (
    <div className="pv-empty">
      <p>{text}</p>
      <Link href={href} className="btn btn-ghost btn-sm">
        <Icon name="plus" size={15} /> {cta}
      </Link>
    </div>
  );
}

const CSS = `
.pv{display:grid; gap:16px; min-width:0;}
.pv-card{background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:22px 24px; min-width:0;}
.pv-head{display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;}
.pv-head h3{font-size:17px; font-weight:650; letter-spacing:-.01em;}
.pv-count{color:var(--muted); font-weight:500;}
.pv-edit{width:36px; height:36px; border-radius:999px; display:inline-grid; place-items:center; color:var(--ink-2);
  border:1px solid transparent; background:transparent; cursor:pointer; flex-shrink:0;
  transition:background .2s var(--ease), border-color .2s var(--ease), transform .25s var(--ease-spring), color .2s;}
.pv-edit:hover{background:var(--surface-2); border-color:var(--line); color:var(--primary-600);}
.pv-edit:active{transform:scale(.9);}
.pv-edit.on{background:var(--primary); color:#fff;}

/* hero */
.pv-hero{padding:0; overflow:hidden; position:relative;}
.pv-cover{height:96px; background:
  radial-gradient(120px 80px at 88% 20%, rgba(255,255,255,.75), transparent 70%),
  radial-gradient(260px 140px at 12% 120%, rgba(54,112,188,.22), transparent 70%),
  linear-gradient(115deg, #dbe7f7 0%, #eaf1fb 48%, #f5ecda 100%);}
.pv-hero-edit{position:absolute; top:12px; right:12px; background:rgba(255,255,255,.8); backdrop-filter:blur(6px); border-color:rgba(255,255,255,.9);}
.pv-hero-body{padding:0 24px 22px;}
.pv-avatar{width:88px; height:88px; border-radius:999px; margin-top:-44px; border:4px solid var(--surface);
  display:grid; place-items:center; color:#fff; font-size:30px; font-weight:700; letter-spacing:.01em;
  box-shadow:0 6px 18px rgba(27,26,36,.12); animation:pop .6s var(--ease-spring) both .1s;}
.pv-hero-row{display:flex; gap:18px; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; margin-top:12px;}
.pv-hero-main{flex:1 1 280px; min-width:0;}
.pv-name{font-size:26px;}
.pv-headline{font-size:15px; color:var(--ink-2); margin-top:6px; line-height:1.45;}
.pv-meta{display:flex; flex-wrap:wrap; gap:4px 0; margin-top:6px; font-size:13.5px; color:var(--muted);}
.pv-meta span + span::before{content:'·'; margin:0 8px;}
.pv-chips{display:flex; flex-wrap:wrap; gap:6px; margin-top:12px;}
.pv-chip{display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; padding:5px 10px; border-radius:999px;
  background:var(--surface-2); border:1px solid var(--line); color:var(--ink-2);}
.pv-chip-major{background:var(--primary-tint); border-color:transparent; color:var(--primary-600);}
.pv-strength{display:flex; align-items:center; gap:12px; padding:10px 16px 10px 10px; border:1px solid var(--line); border-radius:14px; background:var(--surface-2);}
.pv-strength-label{font-size:12px; color:var(--muted); font-weight:600;}
.pv-strength-tier{font-size:15px; font-weight:700; margin-top:1px;}

/* links */
.pv-links{display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:10px;}
.pv-link{display:flex; align-items:center; gap:12px; padding:12px 14px; border:1px solid var(--line); border-radius:14px; background:var(--surface-2); min-width:0;
  transition:transform .3s var(--ease), border-color .2s, box-shadow .3s var(--ease);}
.pv-link:hover{transform:translateY(-2px); border-color:var(--line-strong); box-shadow:0 8px 22px rgba(27,26,36,.06);}
.pv-link:active{transform:scale(.98);}
.pv-link-ic{width:40px; height:40px; border-radius:11px; background:var(--surface); border:1px solid var(--line); display:grid; place-items:center; color:var(--primary-600); flex-shrink:0;}
.pv-link-label{display:block; font-size:14.5px; font-weight:650; line-height:1.3;}
.pv-link-host{display:block; font-size:12.5px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}

/* academic performance */
.pv-stats{display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:10px;}
.pv-stat{border:1px solid var(--line); border-radius:12px; padding:12px 16px 14px; background:var(--surface);
  transition:transform .3s var(--ease), border-color .2s, box-shadow .3s var(--ease);}
.pv-stat:hover{transform:translateY(-2px); border-color:var(--line-strong); box-shadow:0 8px 22px rgba(27,26,36,.05);}
.pv-stat-label{font-size:11.5px; font-weight:650; letter-spacing:.07em; text-transform:uppercase; color:var(--muted);}
.pv-stat-value{font-size:30px; font-weight:450; letter-spacing:-.02em; line-height:1.2; margin-top:4px; font-variant-numeric:tabular-nums; color:var(--ink); white-space:nowrap;}
.pv-stat-max{font-size:14px; font-weight:500; letter-spacing:0; color:var(--muted);}
.pv-aps{display:flex; flex-wrap:wrap; gap:6px; margin-top:12px;}
.pv-ap{font-size:12.5px; padding:4px 10px; border-radius:999px; background:var(--surface-2); border:1px solid var(--line); color:var(--ink-2);}
.pv-ap b{color:var(--primary-600); margin-left:2px;}
.pv-rigor{font-size:13.5px; color:var(--ink-2); margin-top:12px; line-height:1.5;}
.pv-rigor span{color:var(--muted);}

/* target universities */
.pv-targets{list-style:none; margin:0; padding:0;}
.pv-target{display:flex; align-items:center; gap:14px; padding:12px 0; border-bottom:1px solid var(--line); position:relative; background:var(--surface);}
.pv-target:first-child{padding-top:2px;}
.pv-target:last-child{border-bottom:0;}
.pv-num{width:30px; height:30px; border-radius:999px; background:var(--primary-tint); color:var(--primary-600); display:grid; place-items:center;
  font-size:13px; font-weight:650; flex-shrink:0; font-variant-numeric:tabular-nums;}
.pv-tname{flex:1; min-width:0; font-size:15.5px; font-weight:550; line-height:1.35;}
.pv-tloc{display:block; font-size:12.5px; font-weight:400; color:var(--muted); margin-top:1px;}
.pv-top{display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:999px; background:var(--accent-tint); color:#6b4610;
  font-size:12.5px; font-weight:650; flex-shrink:0; white-space:nowrap;}
.pv-top.pop{animation:pop .5s var(--ease-spring) both;}
.pv-star{display:block;}
.pv-tctl{display:flex; gap:4px; flex-shrink:0;}
.pv-ic-btn{width:32px; height:32px; border-radius:9px; border:1px solid var(--line); background:var(--surface); color:var(--ink-2); cursor:pointer;
  display:grid; place-items:center; font-size:15px; transition:transform .25s var(--ease-spring), background .2s, border-color .2s;}
.pv-ic-btn:hover:not(:disabled){border-color:var(--line-strong); background:var(--surface-2);}
.pv-ic-btn:active:not(:disabled){transform:scale(.88);}
.pv-ic-btn:disabled{opacity:.3; cursor:default;}
.pv-ic-btn.on{background:var(--accent-tint); border-color:#ead8b4;}
.pv-ic-btn.on .pv-star{animation:pop .45s var(--ease-spring) both;}
.pv-edit-hint{font-size:13px; color:var(--muted); margin:-6px 0 8px;}
.pv-edit-foot{display:flex; justify-content:space-between; gap:10px; margin-top:12px; flex-wrap:wrap;}
.pv-more{display:inline-flex; align-items:center; gap:4px; margin-top:12px; padding:4px 0; border:0; background:none; cursor:pointer;
  color:var(--primary-600); font:inherit; font-size:14px; font-weight:600;}
.pv-more:hover{text-decoration:underline;}
.pv-reveal{animation:rise .45s var(--ease) both;}

/* rows: activities, honors */
.pv-rows{list-style:none; margin:0; padding:0;}
.pv-rows > li{padding:14px 0; border-bottom:1px solid var(--line);}
.pv-rows > li:first-child{padding-top:2px;}
.pv-rows > li:last-child{border-bottom:0; padding-bottom:0;}
.pv-act{display:flex; gap:14px; align-items:flex-start;}
.pv-act-ic, .pv-honor-ic{width:38px; height:38px; border-radius:11px; display:grid; place-items:center; flex-shrink:0; background:var(--primary-tint); color:var(--primary-600);}
.pv-honor-ic.gold{background:var(--accent-tint); color:var(--accent);}
.pv-act-title{font-size:15px; font-weight:650; line-height:1.35;}
.pv-act-org{font-size:13.5px; color:var(--muted); margin-top:1px;}
.pv-act-desc{font-size:13.5px; line-height:1.55; margin-top:6px; color:var(--ink-2);}
.pv-act-meta{font-size:12px; color:var(--muted); margin-top:6px;}
.pv-honor{display:flex; align-items:center; gap:14px;}
.pv-honor-title{flex:1; min-width:0; font-size:14.5px; font-weight:600; line-height:1.4;}

/* narrative */
.pv-spike{margin:0; padding:12px 16px; border-left:3px solid var(--primary); background:var(--primary-tint); border-radius:0 12px 12px 0; font-size:15px; line-height:1.5;}
.pv-spike span{display:block; font-size:11.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--primary-600); margin-bottom:2px;}
.pv-ps{font-size:13.5px; line-height:1.65; margin-top:12px; white-space:pre-wrap; color:var(--ink-2);}

/* pillars */
.pv-pillars{display:grid; gap:12px;}
.pv-pillar-top{display:flex; justify-content:space-between; font-size:13.5px;}
.pv-pillar-top span{font-weight:600;}
.pv-pillar-top b{font-variant-numeric:tabular-nums;}

/* empty prompts (own profile) */
.pv-empty{display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 16px; border:1px dashed var(--line-strong); border-radius:14px; background:var(--surface-2);}
.pv-empty p{font-size:13.5px; color:var(--muted); flex:1 1 220px; line-height:1.5;}

@media (max-width:560px){
  .pv-card{padding:18px 16px; border-radius:16px;}
  .pv-hero{padding:0;}
  .pv-hero-body{padding:0 16px 18px;}
  .pv-avatar{width:76px; height:76px; margin-top:-38px; font-size:26px;}
  .pv-name{font-size:23px;}
  .pv-strength{width:100%;}
  .pv-stats{grid-template-columns:1fr 1fr;}
  .pv-stat{padding:11px 13px 12px;}
  .pv-stat-value{font-size:26px;}
  .pv-links{grid-template-columns:1fr;}
  .pv-tname{font-size:15px;}
  .pv-target{gap:12px; flex-wrap:wrap;}
  .pv-target .pv-tctl{width:100%; padding-left:42px;}
}
`;
