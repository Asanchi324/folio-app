'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { BrandMark } from '@/components/Brand';
import LangSwitch from '@/components/LangSwitch';

export default function Footer() {
  const { t } = useT();
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <Link href="/" className="nav-brand" style={{ fontSize: 20 }}>
            <BrandMark size={24} />
            Folio
          </Link>
          <p className="muted" style={{ fontSize: 14, marginTop: 10, maxWidth: 320, lineHeight: 1.6 }}>
            {t('Admissions portfolios for students applying abroad — and the schools that guide them.')}
          </p>
        </div>
        <div>
          <div className="footer-h">{t('Product')}</div>
          <Link href="/start">{t('Start free')}</Link>
          <Link href="/#pricing">{t('Pricing')}</Link>
          <Link href="/#schools">{t('For schools')}</Link>
          <Link href="/login">{t('Sign in')}</Link>
        </div>
        <div>
          <div className="footer-h">{t('Company')}</div>
          <Link href="/privacy">{t('Privacy policy')}</Link>
          <Link href="/terms">{t('Terms of use')}</Link>
          <a href="mailto:temirbekov.assan@outlook.com">{t('Contact')}</a>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>© {new Date().getFullYear()} Folio</span>
        <span style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          {t('Made in Kazakhstan')}
          <LangSwitch />
        </span>
      </div>
    </footer>
  );
}
