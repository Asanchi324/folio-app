'use client';

// App chrome for every signed-in-style surface: a left sidebar on desktop and
// an off-canvas drawer on phones. Sections are grouped (Student / Workspace /
// Admin) so new tools slot in without crowding a top bar.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffectivePlan } from '@/lib/account';
import { signOut } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';
import LangSwitch from '@/components/LangSwitch';
import { BrandMark } from '@/components/Brand';
import InviteBanner from '@/components/InviteBanner';
import { streakInfo } from '@/lib/daily';
import ProductTour from '@/components/ProductTour';

const STUDENT = [
  { href: '/today', label: 'Today', icon: 'sun', badge: 'streak' },
  { href: '/portfolio', label: 'Portfolio', icon: 'portfolio', exact: true },
  { href: '/review', label: 'Assessment', icon: 'gauge' },
  { href: '/progress', label: 'Progress', icon: 'target' },
  { href: '/universities', label: 'Universities', icon: 'university' },
  { href: '/discover', label: 'Opportunities', icon: 'compass' },
  { href: '/essay', label: 'Essay coach', icon: 'pen' },
  { href: '/advisor', label: 'AI counselor', icon: 'chat' },
  { href: '/deadlines', label: 'Deadlines', icon: 'calendar' },
  { href: '/share', label: 'Share & PDF', icon: 'share' },
];

const WORKSPACE = [
  { href: '/business', label: 'Overview', icon: 'home', exact: true },
  { href: '/business/students', label: 'Students', icon: 'student' },
  { href: '/business/counselors', label: 'Counselors', icon: 'users' },
  { href: '/business/analytics', label: 'Analytics', icon: 'chart' },
  { href: '/business/billing', label: 'Billing', icon: 'card' },
  { href: '/business/settings', label: 'Workspace settings', icon: 'building' },
];

export default function AppShell({ children }) {
  const path = usePathname();
  const { t } = useT();
  const { user, profile, plan } = useEffectivePlan();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  // Streak badge: read-only peek at the locally cached portfolio (pages own
  // the real portfolio state; the shell must never write it).
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const read = () => {
      try {
        const cached = JSON.parse(localStorage.getItem('folio:portfolio') || 'null');
        setStreak(cached ? streakInfo(cached).streak : 0);
      } catch {
        setStreak(0);
      }
    };
    read();
    // Pages that record progress announce it (see today/progress pages).
    window.addEventListener('folio:daily', read);
    return () => window.removeEventListener('folio:daily', read);
  }, [path]);
  // Lock page scroll behind the open drawer.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Print view renders bare.
  if (path.endsWith('/print')) return children;

  const isStaff =
    Boolean(profile?.orgId) && (profile?.role === 'counselor' || profile?.role === 'orgAdmin');
  const onWorkspace = path.startsWith('/business') || path.startsWith('/counselor');
  const authEnabled = isFirebaseConfigured();

  const isActive = (item) =>
    item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);

  // Plain render helper (not a component) so groups don't remount per render.
  const group = (key, title, items) => (
    <div className="sb-group" key={key}>
      {title && <div className="sb-title">{title}</div>}
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sb-link${isActive(item) ? ' active' : ''}`}
          aria-current={isActive(item) ? 'page' : undefined}
        >
          <Icon name={item.icon} size={18} />
          <span>{t(item.label)}</span>
          {item.badge === 'streak' && streak > 0 && (
            <span className="sb-badge" title={t('Day streak')}>
              {streak}
            </span>
          )}
        </Link>
      ))}
    </div>
  );

  const sidebar = (
    <>
      <div className="sb-head">
        <Link href="/" className="sb-brand">
          <BrandMark size={26} />
          <span>Folio</span>
        </Link>
        <button className="sb-close" onClick={() => setOpen(false)} aria-label={t('Close menu')}>
          <Icon name="close" size={20} />
        </button>
      </div>

      <nav className="sb-nav" aria-label={t('Main')}>
        {isStaff && onWorkspace ? (
          <>
            {group('ws', t('Workspace'), WORKSPACE)}
            {group('st', t('Student tools'), STUDENT)}
          </>
        ) : (
          <>
            {group('st', null, STUDENT)}
            {isStaff && group('ws', t('Workspace'), WORKSPACE)}
          </>
        )}
        {profile?.founder &&
          group('ad', t('Admin'), [{ href: '/admin/orgs', label: 'Founder console', icon: 'shield' }])}
      </nav>

      <div className="sb-foot">
        {plan !== 'pro' && (
          <Link href="/upgrade" className="sb-upgrade">
            <span>
              <b>{t('Folio Pro')}</b>
              <span className="muted">{t('Essay coach, AI counselor, clean PDF')}</span>
            </span>
            <Icon name="arrow" size={16} />
          </Link>
        )}
        <Link href="/settings" className={`sb-link${path === '/settings' ? ' active' : ''}`}>
          <Icon name="settings" size={18} />
          <span>{t('Settings')}</span>
        </Link>
        {authEnabled &&
          (user ? (
            <div className="sb-user">
              <span className="sb-avatar" aria-hidden>
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </span>
              <span className="sb-email" title={user.email}>
                {user.displayName || user.email}
                {plan === 'pro' && <span className="sb-pro">Pro</span>}
              </span>
              <button className="sb-icon" onClick={signOut} aria-label={t('Sign out')} title={t('Sign out')}>
                <Icon name="logout" size={18} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              {t('Sign in to sync')}
            </Link>
          ))}
        <LangSwitch className="sb-lang" />
      </div>
    </>
  );

  return (
    <div className="shell">
      <aside className={`sb${open ? ' open' : ''}`}>{sidebar}</aside>
      {open && <div className="sb-scrim" onClick={() => setOpen(false)} aria-hidden />}
      <ProductTour onDrawer={setOpen} />

      <div className="shell-main">
        <header className="topbar">
          <button className="sb-icon" onClick={() => setOpen(true)} aria-label={t('Open menu')} aria-expanded={open}>
            <Icon name="menu" size={22} />
          </button>
          <Link href="/" className="sb-brand">
            <BrandMark size={24} />
            <span>Folio</span>
          </Link>
        </header>
        <main className="shell-content">
          <InviteBanner />
          {/* keyed by path: each page settles in on navigation */}
          <div key={path} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
