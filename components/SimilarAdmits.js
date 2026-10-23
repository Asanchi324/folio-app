'use client';

// "Admits like you" (on /progress): the closest real admitted applicants from
// the Admit Library, where they got in, why they match, and what they had
// that this profile doesn't yet. Pure client-side — lib/admits.js.

import { useMemo } from 'react';
import { similarAdmits, studentSignals, LEVEL_LABEL, VERIFICATION_LABEL, ADMITS } from '@/lib/admits';
import { useT } from '@/lib/i18n';

// Marks strings for the translation extractor.
const msg = (s) => s;

const REASON_LABEL = {
  field: msg('Same field'),
  country: msg('Same country'),
  international: msg('Also an international applicant'),
  honors: msg('Similar level of honors'),
  activities: msg('Similar level of activities'),
  scores: msg('Similar test score'),
};

export default function SimilarAdmits({ p }) {
  const { t, lang } = useT();
  const list = useMemo(() => similarAdmits(p, 3), [p]);
  const st = useMemo(() => studentSignals(p), [p]);
  const pick = (o) => (o && (o[lang] || o.en)) || '';

  return (
    <section className="card card-pad" style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 20 }}>{t('Admits like you')}</h2>
        <span className="muted" style={{ fontSize: 12.5 }}>{t('{n} verified cases in the library', { n: ADMITS.length })}</span>
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>
        {st.hasData
          ? t('Real applicants closest to your profile — by field, country and the level of your strongest honor and activity — and where they were admitted.')
          : t('Add your activities, honors and test scores to see the real admits closest to you. Until then, here are a few strong cases.')}
      </p>

      <div className="sa-grid stagger">
        {list.map(({ record: r, reasons, gaps }) => (
          <article key={r.id} className="sa-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <span className={`pill ${r.verification === 'C' ? 'pill-muted' : ''}`} title={t(VERIFICATION_LABEL[r.verification])} style={{ fontSize: 11.5 }}>
                {r.verification} · {t(VERIFICATION_LABEL[r.verification])}
              </span>
              <span className="muted" style={{ fontSize: 12 }}>{r.cycle || ''}</span>
            </div>

            <h3 style={{ fontSize: 15.5, marginTop: 10, lineHeight: 1.4 }}>{pick(r.headline)}</h3>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
              {[r.applicant?.city, r.applicant?.country].filter(Boolean).join(', ')}
              {r.applicant?.major ? ` · ${r.applicant.major}` : ''}
            </p>

            <div className="sub-title" style={{ marginTop: 12 }}>{t('Admitted')}</div>
            <div className="sa-schools">
              {r.admitted.map((s) => (
                <span key={s.name} className={`sa-school ${s.enrolled ? 'on' : ''}`}>
                  {s.name}
                  {s.tier && <i>{s.tier}</i>}
                </span>
              ))}
            </div>
            {r.rejected.length > 0 && (
              <>
                <div className="sub-title" style={{ marginTop: 10 }}>{t('Rejected')}</div>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{r.rejected.map((s) => s.name).join(', ')}</p>
              </>
            )}

            {reasons.length > 0 && (
              <div className="sa-reasons">
                {reasons.map((k) => (
                  <span key={k}>{t(REASON_LABEL[k])}</span>
                ))}
              </div>
            )}

            {gaps.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="sub-title">{t('They had, you don’t yet')}</div>
                <ul className="sa-gaps">
                  {gaps.map((g, i) => (
                    <li key={i}>
                      {g.kind === 'sat'
                        ? t('Test score around {n}', { n: g.value })
                        : `${t(LEVEL_LABEL[g.level])}: ${g.title || ''}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {r.lesson && <p style={{ fontSize: 13.5, marginTop: 12, lineHeight: 1.5 }}>{pick(r.lesson)}</p>}

            <a href={r.source.url} target="_blank" rel="noopener noreferrer" className="link" style={{ fontSize: 12.5, marginTop: 10, display: 'inline-block' }}>
              {t('Source')}: {r.source.publisher} ↗
            </a>
          </article>
        ))}
      </div>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.5 }}>
        {t('Single files are noisy: use them to see the level that worked, not as a recipe. A = published by the university, B = confirmed in national press, C = self-reported.')}
      </p>

      <style>{`
        .sa-grid{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-top:16px;}
        .sa-card{border:1px solid var(--line); border-radius:var(--r); padding:14px; min-width:0; display:flex; flex-direction:column;}
        .sa-schools{display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;}
        .sa-school{font-size:12.5px; padding:4px 8px; border-radius:999px; border:1px solid var(--line); display:inline-flex; gap:6px; align-items:center;}
        .sa-school.on{border-color:var(--good); background:var(--good-tint); font-weight:600;}
        .sa-school i{font-style:normal; font-size:11px; color:var(--muted);}
        .sa-reasons{display:flex; flex-wrap:wrap; gap:6px; margin-top:12px;}
        .sa-reasons span{font-size:11.5px; padding:3px 8px; border-radius:6px; background:var(--surface-2); color:var(--ink-2);}
        .sa-gaps{margin:6px 0 0; padding-left:16px; display:grid; gap:4px; font-size:13px; line-height:1.45;}
        @media (max-width:1000px){ .sa-grid{grid-template-columns:minmax(0,1fr);} }
      `}</style>
    </section>
  );
}
