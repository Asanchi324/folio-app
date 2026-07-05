'use client';

// Business Workspace shell — the separate B2B surface. Sidebar navigation on
// desktop, scrollable tab bar on mobile. Guards: must be signed in, in an org,
// and staff (students are pointed back to their portfolio).
//
// `?welcome=1` (Stripe success redirect) shows an activating screen while the
// webhook creates/upgrades the workspace — the users/{uid} onSnapshot flips
// everything live the moment the back-link lands, no polling.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceProvider, useWorkspace } from '@/lib/workspace';
import { signInWithGoogle } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { orgPlanLabel } from '@/lib/plans';

const TABS = [
  { href: '/business', label: 'Overview', glyph: '◫', exact: true },
  { href: '/business/students', label: 'Students', glyph: '🎓' },
  { href: '/business/counselors', label: 'Counselors', glyph: '🧑‍🏫' },
  { href: '/business/analytics', label: 'Analytics', glyph: '▤' },
  { href: '/business/billing', label: 'Billing', glyph: '⬡' },
  { href: '/business/settings', label: 'Settings', glyph: '⚙' },
];

export default function BusinessLayout({ children }) {
  return (
    <WorkspaceProvider>
      <Guarded>{children}</Guarded>
    </WorkspaceProvider>
  );
}

function Guarded({ children }) {
  const { user, ready, org, orgId, isStaff, paid, students, seatLimit } = useWorkspace();
  const path = usePathname();
  const [welcome, setWelcome] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    // welcome=1 → back from Stripe (webhook is creating/upgrading the org);
    // created=1 → just created in-app (the users/{uid} snapshot is in flight).
    setWelcome(q.get('welcome') === '1' || q.get('created') === '1');
  }, []);
  // Failsafe: if the org never materializes (abandoned checkout, webhook not
  // configured), stop the spinner and show the normal empty state.
  useEffect(() => {
    if (!welcome) return;
    const t = setTimeout(() => setWelcome(false), 30000);
    return () => clearTimeout(t);
  }, [welcome]);

  if (!isFirebaseConfigured()) {
    return (
      <Centered icon="🔌" title="Accounts aren’t configured">
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
          The Business Workspace needs Firebase keys on this deployment.
        </p>
      </Centered>
    );
  }
  if (!ready) return <Centered spinner title="Loading your workspace…" />;

  if (!user) {
    return (
      <Centered icon="🏛" title="Sign in to your workspace">
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
          The Business Workspace is where schools and counselors run their cohorts.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 18, width: '100%' }} onClick={() => signInWithGoogle().catch(() => {})}>
          Continue with Google
        </button>
      </Centered>
    );
  }

  if (!orgId) {
    if (welcome) {
      return (
        <Centered spinner title="Setting up your workspace…">
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
            Payment received — we’re creating your Business Workspace. This takes
            a few seconds and this page will open automatically.
          </p>
        </Centered>
      );
    }
    return (
      <Centered icon="🏛" title="No workspace yet">
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
          Create your workspace — set it up first, invite a few students, and
          subscribe when you’re ready to scale.
        </p>
        <Link href="/start?type=business" className="btn btn-primary" style={{ marginTop: 18, width: '100%' }}>
          Set up my workspace
        </Link>
        <Link href="/upgrade?plan=business" className="btn btn-ghost btn-sm" style={{ marginTop: 10, width: '100%' }}>
          See Business pricing
        </Link>
      </Centered>
    );
  }

  if (!isStaff) {
    return (
      <Centered icon="🎓" title="This area is for workspace staff">
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
          You’re connected to {org?.name || 'a workspace'} as a student — your
          counselors see your portfolio from here, and you keep building it in
          the portfolio tab.
        </p>
        <Link href="/portfolio" className="btn btn-primary" style={{ marginTop: 18, width: '100%' }}>
          Back to my portfolio
        </Link>
      </Centered>
    );
  }

  return (
    <div className="ws">
      <aside className="ws-side">
        <div className="ws-org">
          <div className="ws-org-name">{org?.name || 'Workspace'}</div>
          <span className={`pill ${paid ? 'pill-gold' : 'pill-muted'}`} style={{ fontSize: 11 }}>
            {orgPlanLabel(org?.plan)}
          </span>
        </div>
        <nav className="ws-nav" aria-label="Workspace">
          {TABS.map((t) => {
            const active = t.exact ? path === t.href : path.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={`ws-tab${active ? ' active' : ''}`}>
                <span aria-hidden className="ws-glyph">{t.glyph}</span>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="ws-seats">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
            <span className="muted">Student seats</span>
            <span>{students.length}/{seatLimit}</span>
          </div>
          <div className="ws-seatbar">
            <div style={{ width: `${Math.min(100, (students.length / Math.max(1, seatLimit)) * 100)}%` }} />
          </div>
          {!paid && (
            <Link href="/business/billing" className="btn btn-gold btn-sm" style={{ width: '100%', marginTop: 12 }}>
              Activate Business
            </Link>
          )}
        </div>
      </aside>

      <div className="ws-main">{children}</div>

      <style>{`
        .ws{display:grid; grid-template-columns:250px minmax(0,1fr); gap:0;
          max-width:1280px; margin:0 auto; min-height:calc(100vh - 66px);}
        .ws-side{border-right:1px solid var(--line); padding:26px 18px;
          display:flex; flex-direction:column; gap:22px; position:sticky;
          top:66px; height:calc(100vh - 66px); overflow:auto;}
        .ws-org-name{font-family:var(--display-ui); font-weight:700; font-size:16.5px;
          line-height:1.25; margin-bottom:8px; overflow-wrap:anywhere;}
        .ws-nav{display:grid; gap:2px;}
        .ws-tab{display:flex; align-items:center; gap:11px; padding:10px 12px;
          border-radius:10px; font-size:14.5px; font-weight:600; color:var(--muted);
          transition:background .15s ease, color .15s ease;}
        .ws-tab:hover{background:var(--surface); color:var(--ink);}
        .ws-tab.active{background:var(--primary-tint); color:var(--primary);}
        .ws-glyph{width:20px; text-align:center; font-size:15px;}
        .ws-seats{margin-top:auto; padding:14px; border:1px solid var(--line);
          border-radius:14px; background:var(--surface);}
        .ws-seatbar{height:6px; border-radius:999px; background:var(--line);
          overflow:hidden; margin-top:8px;}
        .ws-seatbar div{height:100%; background:var(--primary); border-radius:999px;
          transition:width .4s ease;}
        .ws-main{padding:30px 30px 90px; min-width:0;}
        @media (max-width:900px){
          .ws{display:block;}
          .ws-side{position:static; height:auto; border-right:0;
            border-bottom:1px solid var(--line); padding:14px 16px; gap:12px;}
          .ws-org{display:flex; align-items:center; gap:10px;}
          .ws-org-name{margin-bottom:0; font-size:15px;}
          .ws-nav{display:flex; overflow-x:auto; gap:4px; padding-bottom:2px;
            scrollbar-width:none; -webkit-overflow-scrolling:touch;}
          .ws-nav::-webkit-scrollbar{display:none;}
          .ws-tab{white-space:nowrap; padding:8px 12px; font-size:13.5px;}
          .ws-seats{display:none;}
          .ws-main{padding:22px 16px 80px;}
        }
      `}</style>
    </div>
  );
}

function Centered({ icon, spinner, title, children }) {
  return (
    <div className="wrap" style={{ maxWidth: 460, padding: '80px 24px 120px' }}>
      <div className="card card-pad fade-in" style={{ textAlign: 'center' }}>
        {spinner ? (
          <div className="spin" aria-hidden style={{ width: 26, height: 26, margin: '0 auto', border: '3px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: 999 }} />
        ) : (
          <div style={{ fontSize: 30 }}>{icon}</div>
        )}
        <h1 style={{ fontSize: 24, marginTop: 14 }}>{title}</h1>
        <div style={{ marginTop: 10 }}>{children}</div>
      </div>
    </div>
  );
}
