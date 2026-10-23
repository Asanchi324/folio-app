'use client';

// Ruler picker for test scores and GPA. A tape slides under a fixed centre
// mark; drag it (mouse or finger), flick the trackpad, or use the arrow keys.
// It is magnetic: while dragging, the tape is pulled toward the nearest step,
// so it "clicks" from score to score, and it settles exactly on one on release.
//
// value is a string (portfolio fields are strings); '' means "not set". The
// first touch sets a value, starting from `start`.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';

const MAGNET = 0.35; // 0 = free tape, 1 = hard steps

function decimals(step) {
  const s = String(step);
  return s.includes('.') ? s.split('.')[1].length : 0;
}

export default function ScoreRuler({ label, hint, value, onChange, min, max, step, gap = 12, major = 10, labelEvery, start, format }) {
  const { t } = useT();
  const dec = decimals(step);
  const steps = Math.round((max - min) / step);
  const set = value !== '' && value != null && Number.isFinite(Number(value));
  const toIndex = (v) => Math.max(0, Math.min(steps, Math.round((Number(v) - min) / step)));
  const fromIndex = (i) => (min + i * step).toFixed(dec);
  const index = set ? toIndex(value) : toIndex(start ?? (min + max) / 2);

  const viewport = useRef(null);
  const [width, setWidth] = useState(320);
  // Drag state lives in a ref (pointer events can arrive before a re-render);
  // the state copy only drives rendering.
  const dragRef = useRef(null); // { x0, i0, pos }
  const [drag, setDragState] = useState(null);
  const setDrag = (d) => {
    dragRef.current = d;
    setDragState(d);
  };
  const lastIndex = useRef(index);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const commit = useCallback(
    (i) => {
      const next = Math.max(0, Math.min(steps, i));
      if (next !== lastIndex.current) {
        lastIndex.current = next;
        // A tiny tick on phones that support it — the "click" of the ruler.
        try {
          navigator.vibrate?.(4);
        } catch {
          /* not supported */
        }
      }
      onChange(fromIndex(next));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps, min, step, onChange]
  );

  function onPointerDown(e) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic or already-released pointer */
    }
    lastIndex.current = index;
    setDrag({ x0: e.clientX, i0: index, pos: index });
    if (!set) commit(index);
  }
  function onPointerMove(e) {
    const d = dragRef.current;
    if (!d) return;
    const pos = Math.max(0, Math.min(steps, d.i0 - (e.clientX - d.x0) / gap));
    setDrag({ ...d, pos });
    const snapped = Math.round(pos);
    if (snapped !== lastIndex.current) commit(snapped);
  }
  function onPointerUp() {
    const d = dragRef.current;
    if (!d) return;
    commit(Math.round(d.pos));
    setDrag(null);
  }

  // Trackpad / wheel: horizontal (or vertical) scroll moves the tape.
  const wheelAcc = useRef(0);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      wheelAcc.current += d;
      const n = Math.trunc(wheelAcc.current / gap);
      if (n) {
        wheelAcc.current -= n * gap;
        commit(lastIndex.current + n);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [gap, commit]);

  function onKeyDown(e) {
    const big = Math.max(1, Math.round(major / 2));
    const moves = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: big, PageDown: -big };
    if (e.key in moves) {
      e.preventDefault();
      commit(index + moves[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      commit(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      commit(steps);
    }
  }

  // Magnetic position: the raw drag position, pulled toward the nearest step.
  let pos = index;
  if (drag) {
    const near = Math.round(drag.pos);
    pos = drag.pos + (near - drag.pos) * MAGNET;
  }
  const offset = width / 2 - pos * gap;
  const every = labelEvery ?? major;
  const shown = set ? (format ? format(fromIndex(index)) : fromIndex(index)) : '—';

  return (
    <div className="ruler-field">
      <div className="ruler-head">
        <span className="field-label" style={{ margin: 0 }}>
          {label} {hint && <span className="field-hint">· {hint}</span>}
        </span>
        {set && (
          <button type="button" className="ruler-clear" onClick={() => onChange('')}>
            {t('Clear')}
          </button>
        )}
      </div>
      <div className={`ruler-value${set ? '' : ' unset'}`} aria-hidden>
        {shown}
      </div>
      <div
        ref={viewport}
        className={`ruler${drag ? ' dragging' : ''}`}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={set ? Number(value) : undefined}
        aria-valuetext={set ? String(shown) : t('Not set')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div className="ruler-window">
        <div className="ruler-tape" style={{ transform: `translateX(${offset}px)`, transition: drag ? 'none' : 'transform .22s var(--ease-spring)' }}>
          {Array.from({ length: steps + 1 }).map((_, i) => {
            const isMajor = i % major === 0;
            const showLabel = i % every === 0;
            return (
              <span key={i} className={`ruler-tick${isMajor ? ' major' : ''}${i === index && set ? ' on' : ''}`} style={{ left: i * gap }}>
                {showLabel && <em>{format ? format(fromIndex(i)) : String(Number(fromIndex(i)))}</em>}
              </span>
            );
          })}
        </div>
        </div>
        <span className="ruler-mark" aria-hidden />
      </div>
      {!set && <p className="ruler-help">{t('Drag the ruler to set it')}</p>}
    </div>
  );
}
