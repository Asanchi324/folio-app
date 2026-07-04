'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser, signOut } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';

const LINKS = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/universities', label: 'Universities' },
  { href: '/discover', label: 'Discover' },
];

export default function Nav() {
  const path = usePathname();
  const isLanding = path === '/';
  const onPortfolio = path.startsWith('/portfolio');
  const { user } = useUser();
  const authEnabled = isFirebaseConfigured();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // The "My portfolio" CTA hides once you're already in the portfolio.
  const showCta = !onPortfolio;
  const ctaLabel = isLanding ? 'Start free' : 'My portfolio';
  const ctaHref = isLanding ? '/start' : '/portfolio';

  return (
    <header className="nav-header">
      <div className="wrap nav-inner">
        <Link href="/" className="nav-brand" onClick={() => setOpen(false)}>
          <Mark />
          Folio
        </Link>

        <div className="nav-right">
          {/* section links — inline on desktop, inside the burger on mobile */}
          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((l) => {
              const active = path.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="nav-link"
                  style={{
                    color: active ? 'var(--primary)' : 'var(--muted)',
                    background: active ? 'var(--primary-tint)' : 'transparent',
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* always-visible actions: sign in / account + CTA */}
          <div className="nav-actions">
            {authEnabled &&
              (user ? (
                <Account user={user} />
              ) : (
                <Link href="/login" className="nav-signin">
                  Sign in
                </Link>
              ))}
            {showCta && (
              <Link href={ctaHref} className="btn btn-primary btn-sm">
                {ctaLabel}
              </Link>
            )}
          </div>

          {/* burger — mobile only */}
          <button
            className={`burger${open ? ' open' : ''}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* mobile dropdown menu */}
      <div className={`nav-menu${open ? ' open' : ''}`}>
        {LINKS.map((l) => {
          const active = path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className="nav-menu-link"
              style={active ? { color: 'var(--primary)' } : undefined}
            >
              {l.label}
              <span aria-hidden style={{ color: 'var(--faint)' }}>›</span>
            </Link>
          );
        })}
        {authEnabled && user && (
          <button className="nav-menu-link" onClick={signOut} style={{ color: 'var(--muted)' }}>
            Sign out
            <span aria-hidden>⏻</span>
          </button>
        )}
      </div>

      <style>{`
        .nav-header{
          position:sticky; top:0; z-index:50;
          background:rgba(246,244,238,0.82);
          backdrop-filter:saturate(140%) blur(12px);
          -webkit-backdrop-filter:saturate(140%) blur(12px);
          border-bottom:1px solid var(--line);
        }
        .nav-inner{height:66px; display:flex; align-items:center; justify-content:space-between;}
        .nav-brand{
          font-family:var(--display); font-size:23px; font-weight:600;
          letter-spacing:-0.02em; display:flex; align-items:center; gap:9px;
        }
        .nav-right{display:flex; align-items:center; gap:4px;}
        .nav-links{display:flex; align-items:center; gap:4px;}
        .nav-link{
          font-size:14.5px; font-weight:600; padding:8px 14px; border-radius:999px;
          transition:background .15s ease, color .15s ease;
        }
        .nav-actions{display:flex; align-items:center; gap:10px; margin-left:6px;}
        .nav-signin{font-size:14.5px; font-weight:600; color:var(--muted); padding:8px 10px;}

        /* hamburger */
        .burger{
          display:none; flex-direction:column; gap:5px; width:42px; height:42px;
          align-items:center; justify-content:center; padding:0; margin-left:8px;
          background:transparent; border:1px solid var(--line-strong); border-radius:12px;
          cursor:pointer; -webkit-tap-highlight-color:transparent;
        }
        .burger span{
          display:block; width:20px; height:2px; border-radius:2px; background:var(--ink);
          transition:transform .28s cubic-bezier(.4,.1,.2,1), opacity .2s ease;
        }
        .burger.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}
        .burger.open span:nth-child(2){opacity:0;}
        .burger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}

        /* mobile dropdown */
        .nav-menu{
          overflow:hidden; max-height:0; opacity:0;
          background:rgba(246,244,238,0.98);
          backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
          transition:max-height .32s cubic-bezier(.4,.1,.2,1), opacity .25s ease;
        }
        .nav-menu.open{max-height:340px; opacity:1; border-top:1px solid var(--line);}
        .nav-menu-link{
          display:flex; align-items:center; justify-content:space-between; width:100%;
          padding:16px 24px; font-size:17px; font-weight:600; color:var(--ink);
          border-bottom:1px solid var(--line); background:transparent; border-left:0; border-right:0; border-top:0;
          text-align:left; cursor:pointer;
          opacity:0; transform:translateY(-8px);
          transition:opacity .3s ease, transform .3s ease, background .15s ease;
        }
        .nav-menu-link:active{background:var(--primary-tint);}
        .nav-menu.open .nav-menu-link{opacity:1; transform:none;}
        .nav-menu.open .nav-menu-link:nth-child(1){transition-delay:.04s;}
        .nav-menu.open .nav-menu-link:nth-child(2){transition-delay:.09s;}
        .nav-menu.open .nav-menu-link:nth-child(3){transition-delay:.14s;}
        .nav-menu.open .nav-menu-link:nth-child(4){transition-delay:.19s;}

        @media (max-width:760px){
          .nav-links{display:none;}
          .burger{display:flex;}
          .nav-actions{gap:8px; margin-left:0;}
          .nav-signin{padding:8px 6px;}
        }
        @media (min-width:761px){
          .nav-menu{display:none;}
        }
      `}</style>
    </header>
  );
}

function Account({ user }) {
  const initial = (user.email || '?')[0].toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        title={user.email}
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: 'var(--primary-tint)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {initial}
      </span>
      <button onClick={signOut} className="signout-text">
        Sign out
      </button>
      <style>{`
        .signout-text{
          background:none; border:none; color:var(--muted); font-size:13.5px;
          font-weight:600; cursor:pointer; width:auto; padding:0;
        }
        @media (max-width:760px){ .signout-text{display:none;} }
      `}</style>
    </div>
  );
}

function Mark() {
  return (
    <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M8 20c0-2.2 1.8-4 4-4h9.8c1.1 0 2.1.45 2.85 1.25l2.5 2.6c.38.4.9.62 1.45.62H52c2.2 0 4 1.8 4 4v21c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V20Z"
        fill="var(--primary)"
      />
      <path d="M8 24.8h48V25c0-2.2-1.8-4-4-4H28.5V24.8H8Z" fill="#3a76c8" />
      <g transform="rotate(-8 26 38)">
        <rect x="12" y="27" width="29" height="21" rx="2.4" fill="#fff" />
        <rect x="17" y="33" width="19" height="3.1" rx="1.55" fill="var(--primary)" />
        <rect x="17" y="38.6" width="14" height="3.1" rx="1.55" fill="var(--primary)" />
        <rect x="17" y="44.2" width="9.5" height="3.1" rx="1.55" fill="var(--primary)" />
      </g>
    </svg>
  );
}
