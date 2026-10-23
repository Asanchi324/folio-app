'use client';

// Top navigation for the public site (landing, onboarding, pricing, legal).
// The app itself uses the sidebar in components/AppShell.js.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAccount } from '@/lib/account';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useT } from '@/lib/i18n';
import { BrandMark } from '@/components/Brand';
import Icon from '@/components/Icon';

const LINKS = [
  { href: '/#product', label: 'Product' },
  { href: '/#schools', label: 'For schools' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export default function Nav() {
  const path = usePathname();
  const { t } = useT();
  const { user } = useAccount();
  const authEnabled = isFirebaseConfigured();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  return (
    <header className="nav-header">
      <div className="wrap nav-inner">
        <Link href="/" className="nav-brand">
          <BrandMark size={28} />
          Folio
        </Link>

        <nav className="nav-links" aria-label={t('Main')}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {t(l.label)}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          {authEnabled && !user && (
            <Link href="/login" className="nav-signin">
              {t('Sign in')}
            </Link>
          )}
          <Link href={user ? '/portfolio' : '/start'} className="btn btn-primary btn-sm nav-cta">
            {user ? t('Open Folio') : t('Start free')}
          </Link>
          <button
            className="nav-burger"
            aria-label={open ? t('Close menu') : t('Open menu')}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {open && (
        <div className="nav-menu">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-menu-link" onClick={() => setOpen(false)}>
              {t(l.label)}
            </Link>
          ))}
          {authEnabled && !user && (
            <Link href="/login" className="nav-menu-link">
              {t('Sign in')}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
