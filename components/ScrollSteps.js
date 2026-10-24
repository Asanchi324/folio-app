'use client';

// "How it works" as a pinned, scroll-driven sequence: the section sticks to
// the viewport while you scroll through it, and the four steps take turns —
// the copy and the product visual of the active step slide in, the previous
// one lifts away, and a progress rail fills as you go. Scroll position maps
// to a continuous progress value (0 … steps), so it follows the wheel exactly
// (and stays smooth with Lenis). On phones the same sequence runs stacked —
// rail, copy, visual — inside the pinned viewport. Very short viewports
// (landscape phones) and reduced motion get the plain stacked list instead.

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, Reveal } from '@/components/Motion';

const PER_STEP_VH = 85; // scroll distance per step
const PER_STEP_VH_PHONE = 65; // thumbs travel less per swipe

export default function ScrollSteps({ steps }) {
  const outer = useRef(null);
  const [pinned, setPinned] = useState(false);
  const [phone, setPhone] = useState(false);
  const [p, setP] = useState(0); // 0 … steps.length (continuous)
  const [seen, setSeen] = useState(() => new Set([0]));

  useEffect(() => {
    const mq = window.matchMedia('(min-height: 560px)');
    const narrow = window.matchMedia('(max-width: 899px)');
    const update = () => {
      setPinned(mq.matches && !prefersReducedMotion());
      setPhone(narrow.matches);
    };
    update();
    mq.addEventListener('change', update);
    narrow.addEventListener('change', update);
    return () => {
      mq.removeEventListener('change', update);
      narrow.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = outer.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const raw = travel > 0 ? (-r.top / travel) * steps.length : 0;
      setP(Math.max(0, Math.min(steps.length - 0.0001, raw)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pinned, steps.length]);

  const active = Math.floor(p);
  const local = p - active; // 0 … 1 inside the active step

  // Mount a visual the first time its step becomes active, so its own
  // count-up / bar animations play right as it slides in.
  useEffect(() => {
    if (!seen.has(active)) setSeen((s) => new Set(s).add(active));
  }, [active, seen]);

  if (!pinned) {
    return (
      <div className="lp-steps">
        {steps.map((s, i) => (
          <div key={s.n} className={`lp-step${i % 2 ? ' flip' : ''}`}>
            <Reveal className="lp-step-copy">
              <span className="lp-step-n">
                {s.n} · {s.tag}
              </span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </Reveal>
            <div className="lp-step-visual">{s.visual}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={outer} className="ss" style={{ height: `${steps.length * (phone ? PER_STEP_VH_PHONE : PER_STEP_VH) + 100}vh` }}>
      <div className="ss-stick">
        <div className="ss-grid">
          <div className="ss-left">
            <ol className="ss-rail">
              {steps.map((s, i) => {
                const fill = i < active ? 1 : i === active ? local : 0;
                return (
                  <li key={s.n} className={i === active ? 'on' : i < active ? 'done' : ''}>
                    <span className="ss-rail-n">{s.n}</span>
                    <span className="ss-rail-tag">{s.tag}</span>
                    <span className="ss-rail-bar">
                      <i style={{ transform: `scaleX(${fill})` }} />
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="ss-copies">
              {steps.map((s, i) => (
                <div key={s.n} className={`ss-copy${i === active ? ' on' : i < active ? ' past' : ''}`} aria-hidden={i !== active}>
                  <span className="lp-step-n">
                    {s.n} · {s.tag}
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="ss-right">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className={`ss-visual${i === active ? ' on' : i < active ? ' past' : ''}`}
                // a gentle drift while the step is on screen
                style={i === active ? { '--drift': `${(0.5 - local) * 24}px` } : undefined}
                aria-hidden={i !== active}
              >
                {seen.has(i) ? s.visual : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
