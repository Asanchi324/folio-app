'use client';

// Invite link landing: /join/{CODE}. Resolves the code, shows a transparent
// consent screen (who will see what), then links the account to the org.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from '@/lib/account';
import { lookupJoinCode, joinOrg } from '@/lib/org';
import { signInWithGoogle } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { track } from '@/lib/analytics';

export default function JoinPage() {
  const { code } = useParams();
  const router = useRouter();
  const { user, ready, profile } = useAccount();
  const [codeDoc, setCodeDoc] = useState(undefined); // undefined=loading, null=not found
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!isFirebaseConfigured()) {
      setCodeDoc(null);
      return;
    }
    if (!user) return; // rules require sign-in to resolve a code
    lookupJoinCode(decodeURIComponent(code || ''))
      .then(setCodeDoc)
      .catch(() => setCodeDoc(null));
  }, [code, ready, user]);

  async function accept() {
    setBusy(true);
    setErr('');
    try {
      await joinOrg(user, codeDoc);
      track('org_joined', { role: codeDoc.role });
      router.push(codeDoc.role === 'student' ? '/portfolio?joined=1' : '/business');
    } catch (e) {
      setErr(
        /permission|insufficient/i.test(e?.message || '')
          ? 'This code looks expired or invalid — ask for a fresh link.'
          : e?.message || 'Could not join.'
      );
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 480, padding: '60px 24px 100px' }}>
      <div className="card card-pad" style={{ textAlign: 'center' }}>
        {!isFirebaseConfigured() ? (
          <p className="muted">Accounts aren’t configured on this deployment.</p>
        ) : !ready ? (
          <p className="muted">Checking the invite…</p>
        ) : !user ? (
          <>
            <div style={{ fontSize: 30 }}>🎓</div>
            <h1 style={{ fontSize: 26, marginTop: 12 }}>You’ve been invited</h1>
            <p className="muted" style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55 }}>
              Sign in with Google to see who invited you and connect your portfolio.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={() => signInWithGoogle().catch(() => {})}>
              Continue with Google
            </button>
          </>
        ) : codeDoc === undefined ? (
          <p className="muted">Checking the invite…</p>
        ) : codeDoc === null ? (
          <>
            <div style={{ fontSize: 30 }}>🤔</div>
            <h1 style={{ fontSize: 24, marginTop: 12 }}>Invite not found</h1>
            <p className="muted" style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55 }}>
              The code <b>{decodeURIComponent(code || '')}</b> doesn’t match any
              workspace. Double-check the link or ask for a new one.
            </p>
            <Link href="/portfolio" className="btn btn-ghost" style={{ marginTop: 18 }}>
              Back to my portfolio
            </Link>
          </>
        ) : profile?.orgId === codeDoc.orgId ? (
          <>
            <div style={{ fontSize: 30 }}>✅</div>
            <h1 style={{ fontSize: 24, marginTop: 12 }}>You’re already connected</h1>
            <Link href={codeDoc.role === 'student' ? '/portfolio' : '/business'} className="btn btn-primary" style={{ marginTop: 18 }}>
              Continue →
            </Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: 30 }}>{codeDoc.role === 'student' ? '🤝' : '🧑‍🏫'}</div>
            <h1 style={{ fontSize: 25, marginTop: 12, lineHeight: 1.25 }}>
              Join <span style={{ color: 'var(--primary)' }}>{codeDoc.orgName}</span>
            </h1>
            {codeDoc.role === 'student' ? (
              <p className="muted" style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.6, textAlign: 'left' }}>
                Connecting means your mentor and their team will be able to:
                <br />• <b>see your portfolio</b> (read-only) and its AI review
                <br />• <b>leave comments</b> you’ll see in your builder
                <br /><br />
                You can disconnect anytime from your portfolio settings — access is
                removed immediately.
              </p>
            ) : (
              <p className="muted" style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.6 }}>
                You’re joining as a <b>counselor</b>: you’ll see the workspace roster
                and student portfolios, and can leave comments.
              </p>
            )}
            {profile?.orgId && (
              <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--warn)', lineHeight: 1.5 }}>
                Heads up: you’re currently connected to another workspace — joining
                this one will switch your link.
              </p>
            )}
            {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 12 }}>{err}</p>}
            <button className="btn btn-primary" onClick={accept} disabled={busy} style={{ marginTop: 20, width: '100%' }}>
              {busy ? 'Connecting…' : 'Yes, connect me'}
            </button>
            <Link href="/portfolio" className="muted" style={{ display: 'inline-block', marginTop: 14, fontSize: 13.5 }}>
              Not now
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
