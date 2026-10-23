'use client';

// First-visit tour: five short steps that point at the sidebar sections,
// shown once, right after onboarding. Skippable at any step (button or Esc).
//
// Only people who just finished (or skipped) /start see it: the start page
// sets `folio:tour` = 'pending', and finishing or skipping sets it to 'done'.
// Existing users never get it. On phones the sidebar is a hidden drawer, so
// the steps show as a card without the spotlight.

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { track } from '@/lib/analytics';

const KEY = 'folio:tour';

// Marks strings for the translation extractor.
const msg = (s) => s;

const STEPS = [
  { href: '/portfolio', title: msg('Portfolio'), text: msg('Add grades, activities and awards. Everything else in Folio is built from this.') },
  { href: '/review', title: msg('Assessment'), text: msg('An honest AI review: strengths, gaps and a grade for every activity.') },
  { href: '/universities', title: msg('Universities'), text: msg('Your real chances at each school, based on its admission data.') },
  { href: '/essay', title: msg('Essay coach'), text: msg('Paste a draft: hook, structure and concrete edits.') },
  { href: '/today', title: msg('Today'), text: msg('A few small tasks a day. They move your profile forward.') },
];

export function markTourPending() {
  try {
    if (localStorage.getItem(KEY) !== 'done') localStorage.setItem(KEY, 'pending');
  } catch {
    /* storage unavailable — no tour */
  }
}

export default function ProductTour() {
  const { t } = useT();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    let pending = false;
    try {
      pending = localStorage.getItem(KEY) === 'pending';
    } catch {
      /* ignore */
    }
    if (!pending || path.startsWith('/business') || path.startsWith('/admin')) return;
    const id = setTimeout(() => {
      setOpen(true);
      track('tour_start');
    }, 700);
    return () => clearTimeout(id);
  }, [path]);

  const close = useCallback(
    (how) => {
      setOpen(false);
      try {
        localStorage.setItem(KEY, 'done');
      } catch {
        /* ignore */
      }
      track('tour_end', { how, step: i + 1 });
    },
    [i]
  );

  // Where the current step's sidebar link is (null on phones / hidden sidebar).
  const measure = useCallback(() => {
    const el = document.querySelector(`.sb a.sb-link[href="${STEPS[i].href}"]`);
    const r = el?.getBoundingClientRect();
    setRect(r && r.width > 0 && r.left >= 0 && window.innerWidth > 900 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null);
  }, [i]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close('esc');
      else if (e.key === 'ArrowRight') setI((x) => Math.min(STEPS.length - 1, x + 1));
      else if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const pad = 6;
  const cardStyle = rect
    ? { position: 'fixed', left: rect.left + rect.width + 18, top: Math.max(16, Math.min(window.innerHeight - 220, rect.top - 18)) }
    : { position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)' };

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={t('Quick tour')}>
      {rect ? (
        <div
          className="tour-spot"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      ) : (
        <div className="tour-dim" />
      )}
      <div className="tour-card" style={cardStyle} key={i}>
        <div className="tour-top">
          <span className="tour-count">{i + 1} / {STEPS.length}</span>
          <button type="button" className="tour-skip" onClick={() => close('skip')}>
            {t('Skip tour')}
          </button>
        </div>
        <h3 className="tour-title">{t(step.title)}</h3>
        <p className="tour-text">{t(step.text)}</p>
        <div className="tour-actions">
          <div className="tour-dots" aria-hidden>
            {STEPS.map((_, k) => (
              <span key={k} className={k === i ? 'on' : ''} />
            ))}
          </div>
          {i > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setI(i - 1)}>
              {t('Back')}
            </button>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => (last ? close('done') : setI(i + 1))} autoFocus>
            {last ? t('Got it') : t('Next')}
          </button>
        </div>
      </div>
    </div>
  );
}
