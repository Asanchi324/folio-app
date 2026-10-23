'use client';

// Inertial page scrolling for the public site (Lenis): the page eases toward
// where the wheel or trackpad sends it, so scrolling feels weighted and a
// touch behind the input. Wheel smoothing is off on touch devices (native
// momentum is better there) and everything is off under
// prefers-reduced-motion.
//
// Anchor links (/#product, /#pricing, …) glide instead of jumping. The click
// is caught in the capture phase, before next/link would jump instantly. From
// another page (e.g. /start → /#pricing) we navigate to the page first and
// glide to the section once it has rendered.

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Lenis from 'lenis';
import { prefersReducedMotion } from '@/components/Motion';

const NAV_OFFSET = -76;
const PENDING = 'folio:scroll-to';

function glide(lenis, id) {
  const el = document.getElementById(id);
  if (!el) return false;
  if (lenis) lenis.scrollTo(el, { offset: NAV_OFFSET, duration: 1.3 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + NAV_OFFSET, behavior: 'smooth' });
  return true;
}

export default function SmoothScroll() {
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false });
    window.__lenis = lenis;
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });

    const onClick = (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href*="#"]');
      if (!a || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !url.hash) return;
      const id = decodeURIComponent(url.hash.slice(1));
      // next/link skips its own (instant) navigation for a prevented click,
      // while the link's onClick — e.g. closing the mobile menu — still runs.
      e.preventDefault();
      if (url.pathname === location.pathname) {
        glide(lenis, id);
        history.replaceState(history.state, '', url.hash);
      } else {
        try {
          sessionStorage.setItem(PENDING, id);
        } catch {
          /* no storage — we just land at the top */
        }
        router.push(url.pathname, { scroll: true });
      }
    };
    document.addEventListener('click', onClick, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('click', onClick, true);
      lenis.destroy();
      delete window.__lenis;
    };
  }, [router]);

  // Arrived from another page with a section to show: glide to it.
  useEffect(() => {
    let id = null;
    try {
      id = sessionStorage.getItem(PENDING);
      sessionStorage.removeItem(PENDING);
    } catch {
      /* ignore */
    }
    if (!id) return;
    const t = setTimeout(() => {
      if (glide(window.__lenis, id)) history.replaceState(history.state, '', `#${id}`);
    }, 350);
    return () => clearTimeout(t);
  }, [path]);

  return null;
}
