'use client';

// Motion primitives. Everything here is subtle (short distances, slow
// ease-out) and switches off under prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Animated number: counts from the previous value to the new one.
export function CountUp({ value, duration = 900, decimals = 0, suffix = '' }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(0); // same on server and client (no hydration mismatch)
  const from = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(a + (target - a) * easeOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return (
    <>
      {shown.toFixed(decimals)}
      {suffix}
    </>
  );
}

// True once the element has scrolled into view (then stays true).
export function useInView(options = { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver !== 'function') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, options);
    io.observe(el);
    // Failsafe: never leave content invisible if the observer misbehaves.
    const t = setTimeout(() => setInView(true), 2500);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView];
}

// Fades/rises its children in when scrolled into view. `stagger` makes each
// direct child arrive a beat after the previous one.
export function Reveal({ children, as: Tag = 'div', stagger = false, className = '', style, ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={`rv${stagger ? ' rv-stagger' : ''}${inView ? ' rv-in' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
