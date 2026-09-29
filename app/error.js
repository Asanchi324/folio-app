'use client';

// Route-level error boundary: a calm message instead of a white screen. The
// error details stay in the console (and server logs) — never shown to users.

import { useEffect } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function Error({ error, reset }) {
  const { t } = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="wrap" style={{ maxWidth: 560, paddingTop: 90, paddingBottom: 110 }}>
      <h1 style={{ fontSize: 'clamp(28px,4.4vw,38px)' }}>{t('Something went wrong')}</h1>
      <p className="muted" style={{ fontSize: 16, lineHeight: 1.6, marginTop: 12 }}>
        {t('Your data is saved. Try again — if it keeps happening, reload the page or write to us.')}
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => reset()}>{t('Try again')}</button>
        <Link href="/" className="btn btn-ghost">{t('Home')}</Link>
      </div>
    </div>
  );
}
