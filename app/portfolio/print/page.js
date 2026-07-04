'use client';

// PDF export via print-CSS — zero dependencies, free tier friendly.
// "Download PDF" → this route → window.print() → Save as PDF.
// Layout mimics what an admissions reader actually scans: header, academics/
// testing strip, activities in Common App order, honors with level.
// Free plan gets a discreet "Made with Folio" footer; Pro is clean;
// Business students get their school's name (white-label).

import { useEffect } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/store';
import { useEffectivePlan } from '@/lib/account';
import { planHas } from '@/lib/plans';
import { profileBreakdown } from '@/lib/profile';
import { track } from '@/lib/analytics';

export default function PrintPage() {
  const [p, , ready] = usePortfolio();
  const { plan, org } = useEffectivePlan();

  useEffect(() => {
    track('pdf_view');
  }, []);

  if (!ready) {
    return <div className="wrap" style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Preparing…</div>;
  }

  const { strength } = profileBreakdown(p);
  const cleanPdf = planHas(plan, 'cleanPdf');
  const brand = org?.plan === 'business' ? org?.name : null;
  const t = p.testing || {};
  const a = p.academics || {};
  const acts = (p.activities || []).slice(0, 10);
  const honors = (p.honors || []).slice(0, 5);

  return (
    <div className="print-root">
      {/* screen-only toolbar */}
      <div className="no-print wrap" style={{ padding: '18px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/portfolio" className="btn btn-ghost btn-sm">← Back</Link>
        <div style={{ flex: 1 }} />
        {!cleanPdf && (
          <span className="muted" style={{ fontSize: 12.5 }}>
            Pro removes the footer badge ·{' '}
            <Link href="/upgrade?plan=pro" style={{ color: 'var(--accent)', fontWeight: 600 }}>upgrade</Link>
          </span>
        )}
        <button className="btn btn-primary btn-sm" onClick={() => { track('pdf_print'); window.print(); }}>
          🖨 Print / Save as PDF
        </button>
      </div>

      <div className="sheet">
        {/* header */}
        <header style={{ borderBottom: '2.5px solid #19182b', paddingBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--display)', fontSize: 30, letterSpacing: '-0.01em' }}>
                {p.fullName || 'Your Name'}
              </h1>
              <p style={{ fontSize: 13, marginTop: 6, color: '#444' }}>
                {[
                  p.gradeLevel && (p.gradeLevel === 'gap' ? 'Gap year' : `Grade ${p.gradeLevel}`),
                  p.country,
                  (p.targetCountries || []).length > 0 && `Applying: ${p.targetCountries.join(', ')}`,
                  p.intendedMajor && `Intended major: ${p.intendedMajor}`,
                ]
                  .filter(Boolean)
                  .join('  ·  ')}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777' }}>
                Profile strength
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 26 }}>{strength}<span style={{ fontSize: 14, color: '#777' }}>/100</span></div>
            </div>
          </div>
        </header>

        {/* academics + testing strip */}
        <section className="prow">
          <div>
            <SecTitle>Academics</SecTitle>
            <table className="ptable">
              <tbody>
                <tr><td>GPA</td><td><b>{a.gpa ? `${a.gpa} / ${a.gpaScale || 4}` : '—'}</b></td></tr>
                {a.classRank && <tr><td>Class rank</td><td><b>{a.classRank}</b></td></tr>}
                {a.rigor && <tr><td>Course rigor</td><td><b>{a.rigor}</b></td></tr>}
              </tbody>
            </table>
          </div>
          <div>
            <SecTitle>Testing</SecTitle>
            <table className="ptable">
              <tbody>
                {t.sat && <tr><td>SAT</td><td><b>{t.sat}</b></td></tr>}
                {t.act && <tr><td>ACT</td><td><b>{t.act}</b></td></tr>}
                {t.ielts && <tr><td>IELTS</td><td><b>{t.ielts}</b></td></tr>}
                {t.toefl && <tr><td>TOEFL</td><td><b>{t.toefl}</b></td></tr>}
                {(t.apScores || []).filter((x) => x.subject).map((x) => (
                  <tr key={x.id || x.subject}><td>{x.subject}</td><td><b>{x.score || '—'}</b></td></tr>
                ))}
                {!t.sat && !t.act && !t.ielts && !t.toefl && (t.apScores || []).length === 0 && (
                  <tr><td colSpan={2} style={{ color: '#999' }}>No scores yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* activities */}
        {acts.length > 0 && (
          <section style={{ marginTop: 22 }}>
            <SecTitle>Activities ({acts.length})</SecTitle>
            {acts.map((x, i) => (
              <div key={x.id || i} className="pact">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                    {i + 1}. {x.position || 'Member'}
                    {x.organization && <span style={{ fontWeight: 400, color: '#555' }}> — {x.organization}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#777', flexShrink: 0 }}>
                    {[x.years && `${x.years} yr`, x.hours && `${x.hours} hr/wk`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {x.description && <p style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 3, color: '#222' }}>{x.description}</p>}
              </div>
            ))}
          </section>
        )}

        {/* honors */}
        {honors.length > 0 && (
          <section style={{ marginTop: 22 }}>
            <SecTitle>Honors & awards ({honors.length})</SecTitle>
            {honors.map((h, i) => (
              <div key={h.id || i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', borderBottom: '1px solid #eee', fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{h.title}</span>
                <span style={{ color: '#777', textTransform: 'capitalize', flexShrink: 0 }}>{h.level}</span>
              </div>
            ))}
          </section>
        )}

        {/* spike */}
        {p.narrative?.spike && (
          <section style={{ marginTop: 22 }}>
            <SecTitle>Focus / spike</SecTitle>
            <p style={{ fontSize: 13, lineHeight: 1.55 }}>{p.narrative.spike}</p>
          </section>
        )}

        {/* footer */}
        <footer style={{ marginTop: 30, paddingTop: 12, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#999' }}>
          <span>{brand ? `Prepared with ${brand}` : cleanPdf ? '' : 'Made with Folio · folio.app'}</span>
          <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </footer>
      </div>

      <style>{`
        .sheet{
          max-width:800px; margin:0 auto 60px; background:#fff; color:#19182b;
          padding:48px 52px; border:1px solid var(--line); border-radius:8px;
          box-shadow:var(--shadow);
        }
        .prow{display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-top:22px;}
        .ptable{width:100%; border-collapse:collapse; font-size:13px;}
        .ptable td{padding:4px 0; border-bottom:1px solid #eee;}
        .ptable td:last-child{text-align:right;}
        .pact{margin-top:10px;}
        @media (max-width:640px){.prow{grid-template-columns:1fr;} .sheet{padding:28px 22px;}}
        @media print{
          .no-print, .nav-header{display:none !important;}
          body{background:#fff !important;}
          .sheet{
            max-width:none; margin:0; padding:0; border:0; border-radius:0;
            box-shadow:none;
          }
          .pact{break-inside:avoid;}
          section{break-inside:avoid;}
          @page{margin:16mm;}
        }
      `}</style>
    </div>
  );
}

function SecTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#19182b', borderBottom: '1.5px solid #19182b', paddingBottom: 4, marginBottom: 8 }}>
      {children}
    </div>
  );
}
