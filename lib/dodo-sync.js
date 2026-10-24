// Server-only: reconcile Dodo subscriptions with Folio plans — the safety net
// under the webhook and the return-page confirm. If both were missed (service
// account not set yet, a webhook exhausted its retries, the buyer closed the
// tab), this pass still finds every paying subscription and switches the plan
// on. Run daily by Vercel Cron (/api/cron/billing-sync) and on demand from the
// founder console (/api/admin/billing-sync).
//
// Reports what it could NOT fix, so no payment goes unnoticed:
//   unmatched  — paid, but no Folio account matches the uid / email
//   duplicates — one account paying for the same plan more than once

import { adminFindOne } from '@/lib/firestore-admin';
import { applyChange, resolveUid, ORG_PLANS } from '@/lib/billing-apply';
import { dodo, dodoSubscriptionState, planForProduct } from '@/lib/dodo-server';

const PAID_PLANS = ['pro', ...ORG_PLANS];
const MAX_SUBSCRIPTIONS = 2000; // a serverless run has a time budget

export async function syncDodoSubscriptions() {
  const report = { checked: 0, fixed: [], unmatched: [], duplicates: [], errors: [] };
  const payingByOwner = new Map(); // `${uid}:${plan}` → [subscription ids]

  for await (const sub of dodo().subscriptions.list({ page_size: 100 })) {
    if (++report.checked > MAX_SUBSCRIPTIONS) break;
    const state = dodoSubscriptionState(sub);
    if (!state) continue;
    const plan = planForProduct(sub.product_id) || sub.metadata?.plan || null;
    if (!PAID_PLANS.includes(plan)) continue; // not a Folio plan product
    const email = (sub.customer?.email || '').toLowerCase();
    const summary = { subscriptionId: sub.subscription_id, plan, email, status: sub.status };

    try {
      const who = await resolveUid({ uid: sub.metadata?.uid || null, email });
      if (!who) {
        if (state.action === 'grant') report.unmatched.push(summary);
        continue;
      }
      if (state.action === 'grant') {
        const key = `${who.uid}:${plan}`;
        payingByOwner.set(key, [...(payingByOwner.get(key) || []), sub.subscription_id]);
      }

      // What does Folio currently say for this buyer?
      const target = ORG_PLANS.includes(plan) ? await adminFindOne('orgs', 'ownerUid', who.uid) : who.doc;
      const currentPlan = target?.plan || 'free';
      const ownsThisSub = target?.dodoSubscriptionId === sub.subscription_id;
      const needsGrant = state.action === 'grant' && !(currentPlan === plan && ownsThisSub);
      // Only revoke when this exact subscription is the one on the account.
      const needsRevoke = state.action === 'revoke' && ownsThisSub && currentPlan !== 'free';
      if (!needsGrant && !needsRevoke) continue;

      await applyChange({
        ...state,
        provider: 'dodo',
        plan,
        uid: who.uid,
        email,
        customerId: sub.customer?.customer_id || null,
        subscriptionId: sub.subscription_id,
        event: 'sync',
      });
      report.fixed.push({ ...summary, action: state.action, uid: who.uid });
    } catch (e) {
      report.errors.push({ ...summary, error: e?.message || 'failed' });
    }
  }

  for (const [key, subs] of payingByOwner) {
    if (subs.length > 1) report.duplicates.push({ uid: key.split(':')[0], plan: key.split(':')[1], subscriptionIds: subs });
  }
  return report;
}
