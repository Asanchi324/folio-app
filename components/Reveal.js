'use client';

// Scroll-reveal wrapper: fades/rises content in when it enters the viewport.
// Pure CSS transition driven by one class. IntersectionObserver is the primary
// trigger, with a manual scroll/resize check as a failsafe — if the observer
// never fires (headless browsers, exotic scroll containers, extensions),
// content still reveals instead of staying invisible at opacity 0.
// Respects prefers-reduced-motion (content shows immediately, no movement).

import { useEffect, useRef } from 'react';

export default function Reveal({ children, delay = 0, className = '', style, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let done = false;
    let io = null;
    const show = () => {
      if (done) return;
      done = true;
      el.classList.add('in');
      io?.disconnect();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
    const check = () => {
      const vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
      // Unmeasurable viewport (some embedded/headless browsers) — visible
      // content beats a stuck animation.
      if (!vh) return show();
      const r = el.getBoundingClientRect();
      if (r.top < vh - 20 && r.bottom > 0) show();
    };

    if (
      typeof window.IntersectionObserver !== 'function' ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ) {
      show();
      return;
    }

    io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) show();
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    check();

    return () => {
      io?.disconnect();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
