'use client';

// Score picker for GPA / SAT / IELTS in onboarding: a large value with − / +
// for fine steps, a thin slider that snaps to every step, and a few quick
// picks of typical scores. value is a string ('' = not set); the first touch
// of the slider or a button sets it, starting from `start`.

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';

function decimals(step) {
  const s = String(step);
  return s.includes('.') ? s.split('.')[1].length : 0;
}

export default function ScorePicker({ label, hint, value, onChange, min, max, step, start, quick = [] }) {
  const { t } = useT();
  const dec = decimals(step);
  const set = value !== '' && value != null && Number.isFinite(Number(value));
  const num = set ? Number(value) : Number(start ?? min);
  const [pressed, setPressed] = useState(false);
  const hold = useRef(null);

  const clampStep = (v) => {
    const snapped = Math.round((v - min) / step) * step + min;
    return Math.max(min, Math.min(max, snapped)).toFixed(dec);
  };
  const emit = (v) => onChange(clampStep(v));

  // − / +: one step per tap; holding repeats, faster after a moment.
  function startHold(dir) {
    let current = set ? num : Number(start ?? min) - dir * step;
    const tick = () => {
      current = Number(clampStep(current + dir * step));
      onChange(current.toFixed(dec));
    };
    tick();
    let delay = 380;
    const loop = () => {
      hold.current = setTimeout(() => {
        tick();
        delay = Math.max(60, delay * 0.8);
        loop();
      }, delay);
    };
    loop();
  }
  const stopHold = () => clearTimeout(hold.current);

  const pct = ((num - min) / (max - min)) * 100;
  const shown = set ? Number(value).toFixed(dec) : '—';

  return (
    <div className={`sp${set ? '' : ' sp-unset'}`}>
      <div className="sp-head">
        <span className="field-label" style={{ margin: 0 }}>
          {label} {hint && <span className="field-hint">· {hint}</span>}
        </span>
        {set && (
          <button type="button" className="sp-clear" onClick={() => onChange('')}>
            {t('Clear')}
          </button>
        )}
      </div>

      <div className="sp-main">
        <button
          type="button"
          className="sp-step"
          aria-label={`${label} −`}
          disabled={set && num <= min}
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          −
        </button>
        <span className={`sp-value${pressed ? ' pressed' : ''}`} aria-live="polite">
          {shown}
        </span>
        <button
          type="button"
          className="sp-step"
          aria-label={`${label} +`}
          disabled={set && num >= max}
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          +
        </button>
      </div>

      <input
        type="range"
        className="sp-range"
        min={min}
        max={max}
        step={step}
        value={num}
        aria-label={label}
        style={{ '--p': `${pct}%` }}
        onChange={(e) => emit(Number(e.target.value))}
        onPointerDown={() => {
          setPressed(true);
          if (!set) emit(num);
        }}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
      />
      <div className="sp-scale" aria-hidden>
        <span>{min}</span>
        <span>{max}</span>
      </div>

      {quick.length > 0 && (
        <div className="sp-quick">
          {quick.map((q) => {
            const v = Number(q).toFixed(dec);
            return (
              <button key={q} type="button" className={set && Number(value) === Number(q) ? 'on' : ''} onClick={() => onChange(v)}>
                {q}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
