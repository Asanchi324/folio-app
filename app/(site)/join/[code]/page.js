'use client';

// Invite link landing: /join/{CODE}. Resolves the code, shows a transparent
// consent screen (who will see what), then links the account to the org.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from '@/lib/account';
import { lookupJoinCode, joinOrg } from '@/lib/org';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import ConsentNote from '@/components/ConsentNote';
import { isFirebaseConfigured } from '@/lib/firebase';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';

export default function JoinPage() {
  const { code } = useParams();
  const { t } = useT();
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
      await joinOrg(user, codeDoc, profile?.orgId || null);
      track('org_joined', { role: codeDoc.role });
      router.push(codeDoc.role === 'student' ? '/portfolio?joined=1' : '/business');
    } catch (e) {
      setErr(
        /permission|insufficient/i.test(e?.message || '')
          ? t('This code looks expired or invalid — ask for a fresh link.')
          : t('Could not join.')
      );
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 480, paddingTop: 60, paddingBottom: 100 }}>
      <div className="card card-pad" style={{ textAlign: 'center' }}>
        {!isFirebaseConfigured() ? (
          <p className="muted">{t('Accounts are not configured on this deployment yet.')}</p>
        ) : !ready ? (
          <p className="muted">{t('Checking the invite…')}</p>
        ) : !user ? (
          <>
            <Icon name="mail" size={30} style={{ color: 'var(--faint)' }} />
            <h1 style={{ fontSize: 26, marginTop: 12 }}>{t('You have been invited')}</h1>
            <p className="muted" style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55 }}>
              {t('Sign in to see who invited you and connect your portfolio.')}
            </p>
            <GoogleSignInButton style={{ marginTop: 20, width: '100%' }} />
            <Link href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`} className="link" style={{ display: 'block', marginTop: 10, fontSize: 13.5 }}>
              {t('or sign in with email')}
            </Link>
            <ConsentNote />
          </>
        ) : codeDoc === undefined ? (
          <p className="muted">{t('Checking the invite…')}</p>
        ) : codeDoc === null ? (
          <>
            <h1 style={{ fontSize: 24 }}>{t('Invite not found')}</h1>
            <p className="muted" style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55 }}>
              {t('The code {code} does not match any workspace. Check the link or ask for a new one.', { code: decodeURIComponent(code || '') })}
            </p>
            <Link href="/portfolio" className="btn btn-ghost" style={{ marginTop: 18 }}>
              {t('Back to my portfolio')}
            </Link>
          </>
        ) : profile?.orgId === codeDoc.orgId ? (
          <>
            <h1 style={{ fontSize: 24 }}>{t('You are already connected')}</h1>
            <Link href={codeDoc.role === 'student' ? '/portfolio' : '/business'} className="btn btn-primary" style={{ marginTop: 18 }}>
              {t('Continue')} →
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 25, lineHeight: 1.25 }}>{t('Join {org}', { org: codeDoc.orgName })}</h1>
            {codeDoc.role === 'student' ? (
              <div className="muted" style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.6, textAlign: 'left' }}>
                <p>{t('Connecting means the counselors of this workspace will be able to:')}</p>
                <ul style={{ margin: '8px 0', paddingLeft: 18 }}>
                  <li>{t('see your portfolio and its AI review (read-only)')}</li>
                  <li>{t('leave comments that you see in your portfolio')}</li>
                </ul>
                <p>{t('You can disconnect at any time in Settings — access is removed immediately.')}</p>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.6 }}>
                {t('You are joining as a counselor: you will see the workspace roster and student portfolios, and can leave comments.')}
              </p>
            )}
            {profile?.orgId && (
              <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--warn)', lineHeight: 1.5 }}>
                {t('You are connected to another workspace — joining this one will replace that connection.')}
              </p>
            )}
            {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 12 }}>{err}</p>}
            <button className="btn btn-primary" onClick={accept} disabled={busy} style={{ marginTop: 20, width: '100%' }}>
              {busy ? t('Connecting…') : t('Yes, connect me')}
            </button>
            <Link href="/portfolio" className="muted" style={{ display: 'inline-block', marginTop: 14, fontSize: 13.5 }}>
              {t('Not now')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
