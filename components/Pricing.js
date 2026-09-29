'use client';

// Pricing — rendered on the landing page and /upgrade. One audience toggle
// (students ↔ schools), two focused cards per audience. Reads everything from
// lib/plans.js; `onSelect(planId)` lets /upgrade start checkout directly,
// otherwise CTAs link into the funnel.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PLANS } from '@/lib/plans';
import { useT } from '@/lib/i18n';

const CHECKS = {
  free: [
    ['Portfolio builder', 'Common App–style sections, guided'],
    ['Honest admission odds', '100+ universities, no glaze'],
    ['AI review & polish', 'daily allowance'],
    ['Opportunities database', 'olympiads, programs, deadlines'],
    ['Public share link', 'with a small Folio badge'],
  ],
  pro: [
    ['Everything in Free', 'with generous limits'],
    ['AI essay coach', 'structure, show-don’t-tell, rewrites'],
    ['AI counselor chat', 'strategy, school list, next steps'],
    ['Clean exports', 'PDF & share link without the badge'],
    ['Priority AI limits', 'up to 15 essay reviews a day'],
  ],
  business: [
    ['Up to 20 students', 'each gets full Pro while connected'],
    ['Business Workspace', 'roster, gaps, attention flags'],
    ['Cohort analytics', 'distributions, engagement, CSV export'],
    ['Comments in the builder', 'feedback students actually see'],
    ['White-label', 'your brand on portfolios & PDFs'],
    ['Counselor AI assistant', 'meeting plans, comment drafts'],
  ],
  businessPlus: [
    ['Up to 75 students', 'whole-cohort scale'],
    ['Everything in Business', 'workspace, analytics, white-label'],
    ['Unlimited counselor seats', 'split the cohort across your team'],
    ['Priority support', 'plus an onboarding call'],
    ['Early access', 'new cohort tools first'],
  ],
};

export default function PricingCards({
  currentPlan = null,
  orgPlan = null,
  audience: initialAudience = 'student',
  onSelect = null,
}) {
  const { t } = useT();
  const [audience, setAudience] = useState(initialAudience);
  // /upgrade reads ?plan= after mount — follow the audience it resolves to.
  useEffect(() => {
    setAudience(initialAudience);
  }, [initialAudience]);

  const studentCards = [
    {
      plan: PLANS.free,
      checks: CHECKS.free,
      cta:
        currentPlan === null
          ? { label: 'Start free', href: '/start' }
          : { label: currentPlan === 'free' ? 'Your current plan' : 'Included in Pro', disabled: true },
      featured: false,
    },
    {
      plan: PLANS.pro,
      checks: CHECKS.pro,
      badge: 'Most popular',
      cta:
        currentPlan === 'pro'
          ? { label: 'Your current plan', disabled: true }
          : { label: 'Get Pro', plan: 'pro', href: '/upgrade?plan=pro' },
      featured: true,
    },
  ];

  const orgCards = [
    {
      plan: PLANS.business,
      checks: CHECKS.business,
      badge: 'Most schools start here',
      cta:
        orgPlan === 'business'
          ? { label: 'Your workspace plan', disabled: true }
          : { label: 'Get Business', plan: 'business', href: '/upgrade?plan=business' },
      featured: true,
    },
    {
      plan: PLANS.businessPlus,
      checks: CHECKS.businessPlus,
      cta:
        orgPlan === 'businessPlus'
          ? { label: 'Your workspace plan', disabled: true }
          : { label: 'Get Business Plus', plan: 'businessPlus', href: '/upgrade?plan=businessPlus' },
      featured: false,
    },
  ];

  const cards = audience === 'student' ? studentCards : orgCards;

  return (
    <div className="pr-wrap">
      {/* audience toggle */}
      <div className="pr-toggle" role="tablist" aria-label={t('Pricing')}>
        {[
          ['student', 'For students'],
          ['org', 'For schools and counselors'],
        ].map(([v, label]) => (
          <button
            key={v}
            role="tab"
            aria-selected={audience === v}
            className={`pr-tab${audience === v ? ' on' : ''}`}
            onClick={() => setAudience(v)}
          >
            {t(label)}
          </button>
        ))}
      </div>

      <div className="pr-grid" key={audience}>
        {cards.map(({ plan, checks, cta, badge, featured }) => (
          <div key={plan.id} className={`pr-card${featured ? ' featured' : ''} fade-in`}>
            {badge && <span className="pr-badge">{t(badge)}</span>}
            <div className="pr-head">
              <h3 style={{ fontSize: 18, letterSpacing: '-0.01em' }}>{plan.name}</h3>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>{t(plan.tagline)}</p>
            </div>
            <div className="pr-price">
              <span className="pr-amount">{plan.price.label}</span>
              <span className="pr-period">
                {t(plan.price.period)}
                <br />
                <span className="pr-note">{t(plan.price.note)}</span>
              </span>
            </div>

            <div className="pr-cta">
              <PlanCta cta={cta} featured={featured} onSelect={onSelect} />
            </div>

            <ul className="pr-checks">
              {checks.map(([title, sub]) => (
                <li key={title}>
                  <span className="pr-tick" aria-hidden>✓</span>
                  <span>
                    <b>{t(title)}</b>
                    {sub && <span className="pr-sub"> — {t(sub)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <style>{`
        .pr-wrap{margin-top:40px;}
        .pr-toggle{
          display:flex; gap:4px; padding:4px; border-radius:var(--r);
          background:var(--surface); border:1px solid var(--line);
          width:max-content; max-width:100%; margin:0 auto 30px;
        }
        .pr-tab{
          border:none; background:transparent; cursor:pointer;
          font-family:var(--sans); font-size:14px; font-weight:600;
          color:var(--muted); padding:8px 18px; border-radius:var(--r-sm);
          transition:background .18s ease, color .18s ease;
        }
        .pr-tab.on{background:var(--ink); color:#fff;}
        .pr-grid{
          display:grid; grid-template-columns:repeat(2, minmax(0,1fr));
          gap:20px; max-width:860px; margin:0 auto; align-items:stretch;
        }
        .pr-card{
          position:relative; display:flex; flex-direction:column;
          background:var(--surface); border:1px solid var(--line);
          border-radius:var(--r-lg); padding:30px 28px;
          transition:transform .18s ease, box-shadow .18s ease;
        }
        
        .pr-card.featured{border:1.5px solid var(--ink);}
        .pr-badge{
          position:absolute; top:-13px; left:26px;
          background:var(--ink); color:#fff; font-size:12px; font-weight:600;
          padding:3px 10px; border-radius:6px; white-space:nowrap;
        }
        .pr-head{min-height:74px;}
        .pr-price{display:flex; align-items:center; gap:10px; margin-top:16px;}
        .pr-amount{
          font-family:var(--display); font-size:46px; letter-spacing:-0.03em;
          line-height:1;
        }
        .pr-period{font-size:13px; color:var(--muted); font-weight:600; line-height:1.35;}
        .pr-note{font-weight:500; color:var(--faint); font-size:12px;}
        .pr-cta{margin-top:20px;}
        .pr-cta .btn{width:100%;}
        .pr-checks{
          list-style:none; padding:20px 0 0; margin:18px 0 0;
          border-top:1px solid var(--line); display:grid; gap:11px; flex:1;
        }
        .pr-checks li{display:flex; gap:10px; font-size:13.5px; line-height:1.5;}
        .pr-checks b{font-weight:650;}
        .pr-sub{color:var(--muted);}
        .pr-tick{
          width:18px; height:18px; border-radius:999px; flex-shrink:0;
          background:var(--good-tint); color:var(--good);
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:800; margin-top:2px;
        }
        
        @media (max-width:760px){
          .pr-grid{grid-template-columns:minmax(0,1fr); max-width:430px;}
          .pr-head{min-height:0;}
          .pr-toggle{width:100%;}
          .pr-tab{flex:1; text-align:center; padding:9px 10px;}
        }
      `}</style>
    </div>
  );
}

function PlanCta({ cta, featured, onSelect }) {
  const { t } = useT();
  const cls = featured ? 'btn btn-gold' : 'btn btn-ghost';
  if (cta.disabled) {
    return (
      <span className="btn btn-ghost" style={{ opacity: 0.55, cursor: 'default' }}>
        {t(cta.label)}
      </span>
    );
  }
  if (onSelect && cta.plan) {
    return (
      <button className={cls} onClick={() => onSelect(cta.plan)}>
        {t(cta.label)}
      </button>
    );
  }
  return (
    <Link href={cta.href} className={cls}>
      {t(cta.label)}
    </Link>
  );
}
