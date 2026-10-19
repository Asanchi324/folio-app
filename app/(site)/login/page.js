'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  resendVerification,
  refreshVerification,
  signOut,
  useUser,
} from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useT } from '@/lib/i18n';

const MIN_PASSWORD = 8;

// Only same-site paths — never an open redirect to another origin.
function safeNext() {
  if (typeof window === 'undefined') return '/today';
  const n = new URLSearchParams(window.location.search).get('next') || '';
  return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '/today';
}

function authError(e, t) {
  switch (e?.code) {
    case 'auth/email-already-in-use':
      return t('An account with this email already exists. Sign in instead — if you created it with Google, use “Continue with Google”.');
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return t('Wrong email or password. If you usually sign in with Google, use the Google button — or “Forgot password?” to set a password.');
    case 'auth/weak-password':
      return t('Password must be at least {n} characters.', { n: MIN_PASSWORD });
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return t('Enter a valid email address.');
    case 'auth/too-many-requests':
      return t('Too many attempts. Wait a few minutes and try again.');
    case 'auth/operation-not-allowed':
      return t('Email sign-in is not enabled yet.');
    case 'auth/network-request-failed':
      return t('No connection. Check your internet and try again.');
    default:
      return t('Something went wrong. Try again.');
  }
}

// Sign in: Google, or email + password (verified by a link in the inbox).
// Enables cross-device sync; the product is fully usable signed out as well.
export default function LoginPage() {
  const router = useRouter();
  const { t } = useT();
  const { user, pending } = useUser();
  const [mode, setMode] = useState('signin'); // signin | signup | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const configured = isFirebaseConfigured();

  // Once signed in (via popup OR a redirect that just completed), go on.
  useEffect(() => {
    if (user) router.replace(safeNext());
  }, [user, router]);

  // Waiting for the email link: re-check on load and whenever the tab regains
  // focus (the link is usually opened in another tab or on the phone).
  useEffect(() => {
    if (!pending) return;
    refreshVerification().catch(() => {});
    const onFocus = () => refreshVerification().catch(() => {});
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pending]);

  function switchMode(m) {
    setMode(m);
    setErr('');
    setNote('');
  }

  async function google() {
    setErr('');
    setBusy(true);
    try {
      await signInWithGoogle(); // on mobile this redirects away; effect handles return
      setBusy(false);
    } catch (e) {
      setErr(t('Could not sign in. Allow pop-ups for this site and try again.'));
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setNote('');
    if (mode === 'signup' && password.length < MIN_PASSWORD) {
      setErr(t('Password must be at least {n} characters.', { n: MIN_PASSWORD }));
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') await signUpWithEmail(email, password);
      else if (mode === 'signin') await signInWithEmail(email, password);
      else {
        await resetPassword(email);
        // Same message whether or not the address exists — no account probing.
        setNote(t('If an account exists for {email}, we sent a link to set a new password. Check your inbox and spam.', { email: email.trim() }));
      }
    } catch (e2) {
      // A reset for an unknown address is reported as sent (see above).
      if (mode === 'reset' && e2?.code === 'auth/user-not-found') {
        setNote(t('If an account exists for {email}, we sent a link to set a new password. Check your inbox and spam.', { email: email.trim() }));
      } else setErr(authError(e2, t));
    }
    setBusy(false);
  }

  async function resend() {
    setErr('');
    setBusy(true);
    try {
      await resendVerification();
      setNote(t('Sent again. Check your inbox and spam.'));
    } catch (e) {
      setErr(authError(e, t));
    }
    setBusy(false);
  }

  async function checkNow() {
    setErr('');
    setBusy(true);
    const ok = await refreshVerification().catch(() => false);
    if (!ok) setErr(t('Not confirmed yet. Open the link in the email, then press this button again.'));
    setBusy(false);
  }

  if (pending) {
    return (
      <div className="wrap" style={{ maxWidth: 440, paddingTop: 60, paddingBottom: 100 }}>
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 26 }}>{t('Confirm your email')}</h1>
          <p className="muted" style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55 }}>
            {t('We sent a link to {email}. Open it to finish creating your account.', { email: pending.email })}
          </p>
          <button className="btn btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={checkNow} disabled={busy}>
            {t('I confirmed my email')}
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 10, width: '100%' }} onClick={resend} disabled={busy}>
            {t('Send the email again')}
          </button>
          {note && <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>{note}</p>}
          {err && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 12 }}>{err}</p>}
          <button className="link" style={{ marginTop: 18, fontSize: 13.5, background: 'none', border: 0, cursor: 'pointer' }} onClick={() => signOut()}>
            {t('Use a different email')}
          </button>
        </div>
      </div>
    );
  }

  const title = mode === 'signup' ? t('Create a Folio account') : mode === 'reset' ? t('Reset your password') : t('Sign in to Folio');

  return (
    <div className="wrap" style={{ maxWidth: 440, paddingTop: 60, paddingBottom: 100 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 32 }}>{title}</h1>
        <p className="muted" style={{ marginTop: 10, fontSize: 15.5 }}>
          {mode === 'reset'
            ? t('We will email you a link to set a new password.')
            : t('Keep your portfolio safe and use it on any device.')}
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
            {t('Accounts are not configured yet. You can still build your portfolio — it saves to this device.')}
          </p>
        )}

        {mode !== 'reset' && (
          <>
            <button className="btn btn-ghost" onClick={google} disabled={!configured || busy} style={{ width: '100%', gap: 10 }}>
              <GoogleIcon /> {t('Continue with Google')}
            </button>
            <div className="muted" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 4px', fontSize: 12.5 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              {t('or with email')}
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>
          </>
        )}

        <form onSubmit={submit}>
          <label className="field">
            <span className="field-label">{t('Email')}</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {mode !== 'reset' && (
            <label className="field">
              <span className="field-label">
                {t('Password')}
                {mode === 'signup' && <span className="field-hint"> · {t('at least {n} characters', { n: MIN_PASSWORD })}</span>}
              </span>
              <input
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={mode === 'signup' ? MIN_PASSWORD : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          <button className="btn btn-primary" type="submit" disabled={!configured || busy} style={{ width: '100%', marginTop: 6 }}>
            {busy
              ? t('Please wait…')
              : mode === 'signup'
                ? t('Create account')
                : mode === 'reset'
                  ? t('Send reset link')
                  : t('Sign in')}
          </button>
        </form>

        {note && <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>{note}</p>}
        {err && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 12 }}>{err}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 16, fontSize: 13.5 }}>
          {mode === 'signin' && (
            <>
              <button type="button" className="link" style={linkBtn} onClick={() => switchMode('signup')}>{t('Create an account')}</button>
              <button type="button" className="link" style={linkBtn} onClick={() => switchMode('reset')}>{t('Forgot password?')}</button>
            </>
          )}
          {mode !== 'signin' && (
            <button type="button" className="link" style={linkBtn} onClick={() => switchMode('signin')}>
              ← {t('I already have an account')}
            </button>
          )}
        </div>

        <p className="muted" style={{ fontSize: 12.5, marginTop: 16, textAlign: 'center' }}>
          {t('We use your account only to sign you in and save your portfolio. We never post or share anything.')}{' '}
          <Link href="/privacy" className="link">{t('Privacy policy')}</Link>
        </p>
      </div>

      <p style={{ textAlign: 'center', marginTop: 18 }}>
        <Link href="/portfolio" style={{ fontSize: 13.5, color: 'var(--muted)' }}>
          {t('Continue without an account')} →
        </Link>
      </p>
    </div>
  );
}

const linkBtn = { background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' };

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
