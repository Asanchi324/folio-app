'use client';

// One quiet line under sign-up / sign-in actions: what continuing means and
// the under-16 rule. Informational only — no checkbox, nothing to block on.

import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function ConsentNote({ style }) {
  const { t } = useT();
  return (
    <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, textAlign: 'center', marginTop: 14, ...style }}>
      {t('By continuing you accept:')} <Link href="/terms" className="link">{t('Terms of use')}</Link>
      {' · '}
      <Link href="/privacy" className="link">{t('Privacy policy')}</Link>.{' '}
      {t('Under 16? Use Folio with a parent’s or guardian’s permission.')}
    </p>
  );
}
