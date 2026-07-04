'use client';

// Read-only portfolio renderer — one component, three consumers:
//   • counselor's student view (/counselor/student/[uid])
//   • public share page (/p/[shareId])
//   • PDF/print route (/portfolio/print)
// Options control which sections render (the share flow lets the student
// curate; print shows the Common App shape).

import Ring from '@/components/Ring';
import { profileBreakdown } from '@/lib/profile';

const DEFAULT_OPTS = {
  strength: true,
  academics: true,
  testing: true,
  activities: true,
  honors: true,
  narrative: false, // essays are private by default
};

export default function PortfolioView({ p, options }) {
  const opts = { ...DEFAULT_OPTS, ...(options || {}) };
  const { strength, pillars } = profileBreakdown(p || {});
  const acts = p?.activities || [];
  const honors = p?.honors || [];
  const t = p?.testing || {};
  const a = p?.academics || {};

  const color =
    strength >= 75 ? 'var(--good)' : strength >= 50 ? 'var(--primary)' : strength >= 30 ? 'var(--warn)' : 'var(--bad)';

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* header */}
      <div className="card card-pad" style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ fontSize: 26 }}>{p?.fullName || 'Unnamed student'}</h2>
          <p className="muted" style={{ marginTop: 6, fontSize: 14.5 }}>
            {[
              p?.gradeLevel && (p.gradeLevel === 'gap' ? 'Gap year' : `Grade ${p.gradeLevel}`),
              p?.country,
              p?.intendedMajor && `→ ${p.intendedMajor}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {(p?.targetCountries || []).length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {p.targetCountries.map((c) => (
                <span key={c} className="pill pill-muted" style={{ fontSize: 11.5 }}>{c}</span>
              ))}
            </div>
          )}
        </div>
        {opts.strength && (
          <Ring value={strength} size={96} stroke={10} color={color} label={strength} sublabel="/ 100" />
        )}
      </div>

      {opts.strength && (
        <div className="card card-pad">
          <SectionTitle>Profile pillars</SectionTitle>
          <div style={{ display: 'grid', gap: 11, marginTop: 12 }}>
            {pillars.map((pl) => (
              <div key={pl.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{pl.label}</span>
                  <span className="muted">{pl.score}</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--line)', marginTop: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${pl.score}%`, height: '100%', background: 'var(--primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {opts.academics && (
        <div className="card card-pad">
          <SectionTitle>Academics</SectionTitle>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 12 }}>
            <Stat label="GPA" value={a.gpa ? `${a.gpa} / ${a.gpaScale || 4}` : '—'} />
            {a.classRank && <Stat label="Class rank" value={a.classRank} />}
            {a.rigor && <Stat label="Course rigor" value={a.rigor} wide />}
          </div>
        </div>
      )}

      {opts.testing && (
        <div className="card card-pad">
          <SectionTitle>Testing</SectionTitle>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 12 }}>
            <Stat label="SAT" value={t.sat || '—'} />
            <Stat label="ACT" value={t.act || '—'} />
            <Stat label="IELTS" value={t.ielts || '—'} />
            <Stat label="TOEFL" value={t.toefl || '—'} />
          </div>
          {(t.apScores || []).filter((x) => x.subject).length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {t.apScores
                .filter((x) => x.subject)
                .map((x) => (
                  <span key={x.id || x.subject} className="pill pill-muted" style={{ fontSize: 12 }}>
                    {x.subject}: {x.score || '—'}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {opts.activities && acts.length > 0 && (
        <div className="card card-pad">
          <SectionTitle>Extracurriculars ({acts.length})</SectionTitle>
          <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>
            {acts.map((x, i) => (
              <div key={x.id || i} style={{ borderLeft: '3px solid var(--primary-tint)', paddingLeft: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                  {x.position || 'Member'}
                  {x.organization && <span style={{ fontWeight: 400, color: 'var(--muted)' }}> · {x.organization}</span>}
                </div>
                {x.description && (
                  <p style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 4 }}>{x.description}</p>
                )}
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {[x.years && `${x.years} yr`, x.hours && `${x.hours} hrs/wk`].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {opts.honors && honors.length > 0 && (
        <div className="card card-pad">
          <SectionTitle>Honors & awards ({honors.length})</SectionTitle>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {honors.map((h, i) => (
              <div key={h.id || i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{h.title}</span>
                <span className={`pill ${h.level === 'international' || h.level === 'national' ? 'pill-gold' : 'pill-muted'}`} style={{ fontSize: 11.5, textTransform: 'capitalize', flexShrink: 0 }}>
                  {h.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {opts.narrative && (p?.narrative?.spike || p?.narrative?.personalStatement) && (
        <div className="card card-pad">
          <SectionTitle>Narrative</SectionTitle>
          {p.narrative.spike && (
            <p style={{ fontSize: 14.5, marginTop: 10 }}>
              <b>Spike:</b> {p.narrative.spike}
            </p>
          )}
          {p.narrative.personalStatement && (
            <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 10, whiteSpace: 'pre-wrap' }}>
              {p.narrative.personalStatement}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
      {children}
    </div>
  );
}

function Stat({ label, value, wide }) {
  return (
    <div style={wide ? { flexBasis: '100%' } : undefined}>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 2 }}>{value}</div>
    </div>
  );
}
