'use client';

// PDF export via print-CSS — zero dependencies, free tier friendly.
// "Download PDF" → this route → window.print() → Save as PDF.
// Layout mimics what an admissions reader actually scans: header, academics/
// testing strip, activities in Common App order, honors with level.
// Free plan gets a discreet "Made with Folio" footer; Pro is clean;
// Business students get their school's name (white-label).
// The sheet itself stays in English — it mirrors the Common App, which is
// submitted in English; only the on-screen toolbar is translated.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/store';
import { useEffectivePlan } from '@/lib/account';
import { planHas, isOrgPaidPlan } from '@/lib/plans';
import { profileBreakdown } from '@/lib/profile';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';

export default function PrintPage() {
  const { t: tr } = useT();
  const [p, , ready] = usePortfolio();
  const { plan, org } = useEffectivePlan();
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    track('pdf_view');
  }, []);

  // Mobile Safari/Chrome can take a few seconds to spin up the system print
  // sheet — during that gap the button must show progress, or it looks dead and
  // users tap repeatedly. We reset when the sheet closes (afterprint), when the
  // tab regains focus/visibility (user backed out of the print UI), and via a
  // safety timeout in case none of those fire.
  useEffect(() => {
    if (!printing) return;
    const reset = () => setPrinting(false);
    const safety = setTimeout(reset, 9000);
    window.addEventListener('afterprint', reset);
    window.addEventListener('focus', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      clearTimeout(safety);
      window.removeEventListener('afterprint', reset);
      window.removeEventListener('focus', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [printing]);

  function handlePrint() {
    if (printing) return;
    track('pdf_print');
    setPrinting(true);
    // Let the spinner paint before window.print() — the call blocks/steals the
    // main thread while the print dialog spins up, so we defer a frame first.
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          window.print();
        } catch {
          setPrinting(false);
        }
      }, 50);
    });
  }

  if (!ready) {
    return <div className="wrap" style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>{tr('Loading…')}</div>;
  }

  const { strength } = profileBreakdown(p);
  const cleanPdf = planHas(plan, 'cleanPdf');
  const brand = isOrgPaidPlan(org?.plan) ? org?.brandName || org?.name : null;
  const t = p.testing || {};
  const a = p.academics || {};
  const acts = (p.activities || []).slice(0, 10);
  const honors = (p.honors || []).slice(0, 5);

  return (
    <div className="print-root">
      {/* screen-only toolbar */}
      <div className="no-print wrap" style={{ padding: '18px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/share" className="btn btn-ghost btn-sm">← {tr('Back')}</Link>
        <div style={{ flex: 1 }} />
        {!cleanPdf && (
          <span className="muted" style={{ fontSize: 12.5 }}>
            {tr('Pro removes the footer badge')} ·{' '}
            <Link href="/upgrade?plan=pro" className="link">{tr('Upgrade')}</Link>
          </span>
        )}
        <button className="btn btn-primary btn-sm" onClick={handlePrint} disabled={printing} aria-busy={printing}>
          {printing ? <><Spinner /> {tr('Opening print…')}</> : tr('Print / Save as PDF')}
        </button>
      </div>

      <div className="sheet">
        {/* brand lockup — school brand for white-label orgs, otherwise Folio */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          {brand ? (
            <span style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, color: '#19182b' }}>{brand}</span>
          ) : (
            <FolioLogo />
          )}
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9a9aa5', fontWeight: 700 }}>
            Application portfolio
          </span>
        </div>

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
        <footer style={{ marginTop: 30, paddingTop: 12, borderTop: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: '#999' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {brand ? (
              `Prepared with ${brand}`
            ) : (
              <>
                <FolioGlyph size={14} />
                {cleanPdf ? 'folio.app' : 'Made with Folio · folio.app'}
              </>
            )}
          </span>
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
        @media (max-width:640px){.prow{grid-template-columns:minmax(0,1fr);} .sheet{padding:28px 22px;}}
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

// Folio folder mark — matches app/icon.svg, brand blue, print-safe.
function FolioGlyph({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M8 22c0-2.2 1.8-4 4-4h8.8c1 0 2 .4 2.7 1.1l2.3 2.4c.4.4.9.6 1.4.6H50c2.2 0 4 1.8 4 4v18c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V22Z" fill="#4585d9" />
      <path d="M8 26.3h46V26c0-2.2-1.8-4-4-4H27V26.3H8Z" fill="#3a76c8" />
      <g transform="rotate(-8 25 37)">
        <rect x="12" y="28" width="26" height="18.5" rx="2.2" fill="#fff" />
        <rect x="16.5" y="33" width="17" height="2.8" rx="1.4" fill="#4585d9" />
        <rect x="16.5" y="38" width="12.5" height="2.8" rx="1.4" fill="#4585d9" />
        <rect x="16.5" y="43" width="8.5" height="2.8" rx="1.4" fill="#4585d9" />
      </g>
    </svg>
  );
}

function FolioLogo() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <FolioGlyph size={24} />
      <span style={{ fontFamily: 'var(--display)', fontSize: 19, fontWeight: 700, color: '#19182b', letterSpacing: '-0.01em' }}>
        Folio
      </span>
    </span>
  );
}

function Spinner() {
  return (
    <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SecTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#19182b', borderBottom: '1.5px solid #19182b', paddingBottom: 4, marginBottom: 8 }}>
      {children}
    </div>
  );
}
