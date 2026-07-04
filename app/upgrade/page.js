'use client';

// Upgrade page — billing is NOT wired yet (deliberately, see REPORT.md).
// This page shows the plans and routes intent to the founder: paid buttons
// lead to a "write to us" contact until a payment provider is chosen.
// Plans are granted manually via the founder console (/admin/orgs).

import { useEffect, useState } from 'react';
import PricingCards from '@/components/Pricing';
import { useAccount } from '@/lib/account';

export default function UpgradePage() {
  const { profile } = useAccount();
  // Read ?plan= without useSearchParams to keep the page fully static
  // (no Suspense boundary needed).
  const [wanted, setWanted] = useState(null);
  useEffect(() => {
    setWanted(new URLSearchParams(window.location.search).get('plan'));
  }, []);

  return (
    <div className="wrap" style={{ padding: '48px 24px 100px' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <span className="pill pill-gold">Folio Premium</span>
        <h1 style={{ fontSize: 'clamp(30px,4.4vw,44px)', marginTop: 16 }}>
          Go deeper when you’re ready.
        </h1>
        <p className="muted" style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.6 }}>
          The builder, honest chances and AI review are free forever. Pro adds your
          personal AI counselor and essay coach; Business adds the whole cockpit for
          schools and counselors.
        </p>
      </div>

      <PricingCards currentPlan={profile?.plan || 'free'} orgPlan={null} />

      <div
        className="card card-pad"
        style={{
          marginTop: 36,
          maxWidth: 640,
          marginInline: 'auto',
          textAlign: 'center',
          borderColor: 'var(--accent)',
          background: 'var(--accent-tint)',
        }}
      >
        <h3 style={{ fontSize: 18 }}>
          {wanted === 'pro' ? 'Pro is almost here 🎉' : 'Early access'}
        </h3>
        <p style={{ fontSize: 14.5, marginTop: 10, lineHeight: 1.6 }}>
          Online payments are coming soon. Until then we onboard upgrades personally —
          write to us and we’ll activate your plan the same day.
        </p>
        <a
          href="mailto:hello@folio.app?subject=Folio%20Pro%20upgrade"
          className="btn btn-gold"
          style={{ marginTop: 16 }}
        >
          Write to us → hello@folio.app
        </a>
      </div>
    </div>
  );
}
