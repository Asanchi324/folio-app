'use client';

// Privacy-first analytics.
//
//   • Nothing loads until the visitor opts in: no gtag script, no cookies, no
//     network calls to Google. The choice lives in the first-party
//     `folio_consent` cookie (granted | denied), 6 months.
//   • Only what we need for the product funnel is sent: page views and the
//     named events from lib/analytics.js. Google signals and ad
//     personalisation are off.
//   • URLs are redacted before they leave the browser: share ids, invite codes
//     and student uids are capability tokens / personal ids, so /p/abc123
//     becomes /p/:id. Query strings and hashes are dropped entirely.
//
// Without NEXT_PUBLIC_GA_ID this renders nothing at all (no banner either).

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

const COOKIE = 'folio_consent';

function readConsent() {
  const m = document.cookie.match(/(?:^|;\s*)folio_consent=(granted|denied)/);
  return m ? m[1] : null;
}

function writeConsent(v) {
  document.cookie = `${COOKIE}=${v}; path=/; max-age=${60 * 60 * 24 * 182}; samesite=lax${
    location.protocol === 'https:' ? '; secure' : ''
  }`;
}

export function redactPath(path) {
  return String(path || '/')
    .replace(/^\/p\/[^/]+/, '/p/:id')
    .replace(/^\/join\/[^/]+/, '/join/:code')
    .replace(/^\/counselor\/student\/[^/]+/, '/counselor/student/:uid');
}

let loaded = false;
function loadGtag(gaId) {
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', gaId, {
    send_page_view: false, // we send redacted page views ourselves
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(s);
}

export default function Analytics({ gaId }) {
  const path = usePathname();
  const { t } = useT();
  const [consent, setConsent] = useState('unknown');

  useEffect(() => {
    setConsent(readConsent() || 'ask');
  }, []);

  useEffect(() => {
    if (consent === 'granted' && gaId) loadGtag(gaId);
  }, [consent, gaId]);

  // Redacted page_view on every route change once analytics is on.
  useEffect(() => {
    if (consent !== 'granted' || typeof window.gtag !== 'function') return;
    const clean = redactPath(path);
    window.gtag('event', 'page_view', {
      page_path: clean,
      page_location: `${location.origin}${clean}`,
      page_title: document.title,
    });
  }, [path, consent]);

  if (!gaId || consent !== 'ask') return null;

  const choose = (v) => {
    writeConsent(v);
    setConsent(v);
  };

  return (
    <div className="consent" role="dialog" aria-live="polite" aria-label={t('Cookie preferences')}>
      <p>
        {t('We use one optional analytics cookie to see which parts of Folio help students. No ads, no selling data.')}{' '}
        <Link href="/privacy">{t('Privacy policy')}</Link>
      </p>
      <div className="consent-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => choose('denied')}>
          {t('Only necessary')}
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => choose('granted')}>
          {t('Allow analytics')}
        </button>
      </div>
    </div>
  );
}

// Lets the settings / privacy page reopen the choice.
export function resetConsent() {
  document.cookie = `${COOKIE}=; path=/; max-age=0`;
  location.reload();
}
