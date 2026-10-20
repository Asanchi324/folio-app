'use client';

// "Continue with Google" with its own error line, so a failed sign-in is never
// silent (e.g. auth/unauthorized-domain on a domain missing from Firebase).
import { useState } from 'react';
import { signInWithGoogle, googleSignInError } from '@/lib/auth';
import { useT } from '@/lib/i18n';

export default function GoogleSignInButton({ className = 'btn btn-primary', style }) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function go() {
    setErr('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setErr(googleSignInError(e, t));
    }
    setBusy(false);
  }

  return (
    <>
      <button className={className} style={style} onClick={go} disabled={busy}>
        {t('Continue with Google')}
      </button>
      {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>{err}</p>}
    </>
  );
}
