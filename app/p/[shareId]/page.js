// Public read-only portfolio — /p/{shareId}. Server component: fetches the
// curated snapshot from shares/{shareId} via the Firestore REST API (public
// read per rules), renders it beautifully, and emits OG metadata so links
// unfurl nicely in Telegram/Instagram/WhatsApp.
//
// This page is also a growth loop: the footer invites viewers to build their
// own portfolio (badge hidden for Pro owners).

import Link from 'next/link';
import PortfolioView from '@/components/PortfolioView';
import { decodeFields } from '@/lib/plan-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function fetchShare(shareId) {
  const pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!pid || !key || !/^[a-z0-9-]{8,64}$/i.test(shareId || '')) return null;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/shares/${shareId}?key=${key}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const docJson = await res.json();
    return decodeFields(docJson.fields);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { shareId } = await params;
  const share = await fetchShare(shareId);
  const s = share?.snapshot;
  if (!s) return { title: 'Portfolio — Folio' };
  const name = s.fullName || 'A student';
  const bits = [
    s.intendedMajor && `${s.intendedMajor}`,
    s.strength?.value != null && `Profile strength ${s.strength.value}/100`,
    (s.activities || []).length && `${s.activities.length} activities`,
  ]
    .filter(Boolean)
    .join(' · ');
  return {
    title: `${name} — application portfolio | Folio`,
    description: bits || 'A Common App–style portfolio built with Folio.',
    openGraph: {
      title: `${name} — application portfolio`,
      description: bits || 'Built with Folio — honest AI feedback and real admission odds.',
      type: 'profile',
    },
    twitter: { card: 'summary' },
  };
}

export default async function SharePage({ params }) {
  const { shareId } = await params;
  const share = await fetchShare(shareId);
  const s = share?.snapshot;

  if (!s) {
    return (
      <div className="wrap" style={{ maxWidth: 560, padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 34 }}>🔒</div>
        <h1 style={{ fontSize: 28, marginTop: 14 }}>This portfolio isn’t public</h1>
        <p className="muted" style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.6 }}>
          The link may have been turned off by its owner, or it never existed.
        </p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
          Build your own — free
        </Link>
      </div>
    );
  }

  // Reconstruct a portfolio-shaped object for the shared renderer.
  const p = {
    fullName: s.fullName,
    gradeLevel: s.gradeLevel,
    country: s.country,
    targetCountries: s.targetCountries || [],
    intendedMajor: s.intendedMajor,
    academics: s.academics || {},
    testing: s.testing || {},
    activities: s.activities || [],
    honors: s.honors || [],
    narrative: s.narrative || {},
  };
  const options = {
    testing: Boolean(s.testing),
    narrative: Boolean(s.narrative),
    strength: Boolean(s.strength),
  };

  return (
    <div className="wrap" style={{ maxWidth: 760, padding: '36px 24px 80px' }}>
      {s.brand && (
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 14, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
          Presented by {s.brand}
        </p>
      )}
      <PortfolioView
        p={p}
        options={options}
        precomputed={s.strength ? { strength: s.strength.value, pillars: s.strength.pillars || [] } : undefined}
      />

      {/* viral footer */}
      <div style={{ marginTop: 34, textAlign: 'center' }}>
        {s.badge !== false ? (
          <Link
            href="/"
            className="card"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 22px' }}
          >
            <span style={{ fontSize: 16 }}>📁</span>
            <span style={{ fontSize: 14 }}>
              Made with <b style={{ fontFamily: 'var(--display)' }}>Folio</b> ·{' '}
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Build yours free →</span>
            </span>
          </Link>
        ) : (
          <p className="muted" style={{ fontSize: 12 }}>folio</p>
        )}
      </div>
    </div>
  );
}
