'use client';

// Pricing cards — rendered on the landing page and /upgrade. Reads everything
// from lib/plans.js so prices/features are edited in one place. Gold accent
// marks the paid tiers (the product-wide "premium" color).

import Link from 'next/link';
import { PLANS } from '@/lib/plans';

const UPGRADE_MAIL =
  'mailto:hello@folio.app?subject=Folio%20upgrade&body=Hi!%20I%27d%20like%20to%20upgrade%20my%20Folio%20plan.';

export default function PricingCards({ currentPlan = null, orgPlan = null }) {
  const cards = [
    {
      plan: PLANS.free,
      cta:
        currentPlan === null
          ? { label: 'Start free', href: '/start' }
          : { label: 'Your current plan', disabled: currentPlan === 'free' && orgPlan !== 'business', href: '/portfolio' },
      highlight: false,
    },
    {
      plan: PLANS.pro,
      cta:
        currentPlan === 'pro'
          ? { label: 'Your current plan', disabled: true }
          : { label: 'Upgrade to Pro', href: '/upgrade?plan=pro' },
      highlight: true,
      badge: 'Most popular',
    },
    {
      plan: PLANS.business,
      cta:
        orgPlan === 'business'
          ? { label: 'Your workspace plan', disabled: true }
          : { label: 'Create a workspace', href: '/counselor/new' },
      secondary: { label: 'Talk to us', href: UPGRADE_MAIL },
      highlight: false,
      gold: true,
    },
  ];

  return (
    <div className="pricing-grid">
      {cards.map(({ plan, cta, secondary, highlight, badge, gold }) => (
        <div
          key={plan.id}
          className={`card pricing-card${highlight ? ' pricing-popular' : ''}`}
        >
          {badge && <span className="pricing-badge">{badge}</span>}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 21, color: gold || highlight ? 'var(--accent)' : 'var(--ink)' }}>
              {plan.name}
            </h3>
            {plan.id !== 'free' && <span aria-hidden style={{ fontSize: 16 }}>{gold ? '🏛' : '✨'}</span>}
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 34, letterSpacing: '-0.02em' }}>
              {plan.price.label}
            </span>
          </div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{plan.price.note}</p>
          <p style={{ fontSize: 14.5, marginTop: 14, lineHeight: 1.5, minHeight: 44 }}>{plan.tagline}</p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'grid', gap: 9, flex: 1 }}>
            {plan.bullets.map((b) => (
              <li key={b} style={{ display: 'flex', gap: 9, fontSize: 13.5, lineHeight: 1.45 }}>
                <span style={{ color: plan.id === 'free' ? 'var(--good)' : 'var(--accent)', fontWeight: 800 }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div style={{ display: 'grid', gap: 8, marginTop: 22 }}>
            {cta.disabled ? (
              <span className="btn btn-ghost" style={{ opacity: 0.6, cursor: 'default' }}>{cta.label}</span>
            ) : cta.href?.startsWith('mailto:') ? (
              <a href={cta.href} className={highlight || gold ? 'btn btn-gold' : 'btn btn-primary'}>{cta.label}</a>
            ) : (
              <Link href={cta.href} className={highlight || gold ? 'btn btn-gold' : 'btn btn-primary'}>
                {cta.label}
              </Link>
            )}
            {secondary && (
              <a href={secondary.href} className="btn btn-ghost btn-sm">{secondary.label}</a>
            )}
          </div>
        </div>
      ))}

      <style>{`
        .pricing-grid{
          display:grid; grid-template-columns:repeat(3, minmax(0,1fr));
          gap:18px; margin-top:44px; align-items:stretch;
        }
        .pricing-card{
          position:relative; padding:26px; display:flex; flex-direction:column;
          transition:transform .18s ease, box-shadow .18s ease;
        }
        .pricing-card:hover{transform:translateY(-3px); box-shadow:var(--shadow);}
        .pricing-popular{
          border-color:var(--accent);
          box-shadow:0 10px 34px rgba(192,138,45,0.16);
        }
        .pricing-badge{
          position:absolute; top:-12px; left:50%; transform:translateX(-50%);
          background:var(--accent); color:#fff; font-size:11.5px; font-weight:700;
          letter-spacing:0.06em; text-transform:uppercase; padding:4px 14px;
          border-radius:999px; white-space:nowrap;
        }
        @media (max-width:900px){
          .pricing-grid{grid-template-columns:1fr; max-width:440px; margin-inline:auto;}
        }
      `}</style>
    </div>
  );
}
