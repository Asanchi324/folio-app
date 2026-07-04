'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, useUser } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';

// Google sign-in (Firebase). Enables cross-device sync; the product is fully
// usable signed out as well.
export default function LoginPage() {
  const router = useRouter();
  const { user } = useUser();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const configured = isFirebaseConfigured();

  // Once signed in (via popup OR a redirect that just completed), go to the app.
  useEffect(() => {
    if (user) router.replace('/portfolio');
  }, [user, router]);

  async function google() {
    setErr('');
    setBusy(true);
    try {
      await signInWithGoogle(); // on mobile this redirects away; effect handles return
    } catch (e) {
      setErr(e.message || 'Could not sign in.');
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 440, padding: '60px 24px 100px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 32 }}>Sign in to Folio</h1>
        <p className="muted" style={{ marginTop: 10, fontSize: 15.5 }}>
          Save your portfolio and sync it across every device.
        </p>
      </div>

      <div className="card card-pad">
        {!configured && (
          <p
            style={{
              background: 'var(--warn-tint)',
              color: '#8a5a13',
              fontSize: 13.5,
              padding: '10px 12px',
              borderRadius: 'var(--r-sm)',
              marginBottom: 16,
            }}
          >
            Accounts aren’t configured yet — add Firebase keys to enable sign-in.
            You can still build your portfolio (it saves to this device).
          </p>
        )}

        <button className="btn btn-ghost" onClick={google} disabled={!configured || busy} style={{ width: '100%', gap: 10 }}>
          <GoogleIcon /> {busy ? 'Signing in…' : 'Continue with Google'}
        </button>

        {err && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 12 }}>{err}</p>}

        <p className="muted" style={{ fontSize: 12.5, marginTop: 16, textAlign: 'center' }}>
          We only use your Google account to save your portfolio. Nothing is shared.
        </p>
      </div>

      <p style={{ textAlign: 'center', marginTop: 18 }}>
        <Link href="/portfolio" style={{ fontSize: 13.5, color: 'var(--muted)' }}>
          Continue without an account →
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z" />
      <path fill="#FBBC05" d="M10.3 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.8-3.7-13.7-9.1l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
