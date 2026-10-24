'use client';

// Founder console — the manual "billing back office" until payments exist.
// Gated twice: this UI renders only for FOLIO_ADMIN_EMAILS (checked server-
// side via /api/admin/me), and every write below only succeeds if the same
// email is in the isFounder() list inside firestore.rules.
//
// What the founder does here when closing a sale:
//   1. Client creates their own workspace at /start?type=business (or you create it
//      for them below), 2. you flip the org to Business + set seats,
//   3. they invite students with their join code. Done — no code changes.

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAccount } from '@/lib/account';
import { apiPost } from '@/lib/auth';
import { migrateCounselorCode, getCounselorCode } from '@/lib/org';

export default function FounderOrgsPage() {
  const { user, ready } = useAccount();
  const [isAdmin, setIsAdmin] = useState(undefined);
  const [orgs, setOrgs] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    apiPost('/api/admin/me', {})
      .then((d) => setIsAdmin(Boolean(d.admin)))
      .catch(() => setIsAdmin(false));
  }, [ready, user]);

  async function loadOrgs() {
    const db = getDb();
    if (!db) return;
    try {
      const snap = await getDocs(collection(db, 'orgs'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Counselor codes live in orgs/{id}/private/codes; legacy orgs still
      // carry them on the org doc — opening this page migrates them all.
      const withCodes = await Promise.all(
        list.map(async (o) => {
          if (o.counselorCode) {
            await migrateCounselorCode(o.id, o.counselorCode);
            return o;
          }
          return { ...o, counselorCode: await getCounselorCode(o.id) };
        })
      );
      setOrgs(withCodes);
    } catch (e) {
      setMsg(`Could not list orgs: ${e.message}`);
    }
  }

  useEffect(() => {
    if (isAdmin) loadOrgs();
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function setOrgPlan(org, plan) {
    const db = getDb();
    try {
      await updateDoc(doc(db, 'orgs', org.id), { plan });
      setMsg(`${org.name} → ${plan}`);
      loadOrgs();
    } catch (e) {
      setMsg(`Denied: ${e.message} (is your email in firestore.rules isFounder()?)`);
    }
  }

  async function setSeats(org) {
    const n = Number(prompt(`Seats for ${org.name}:`, org.seats || 3));
    if (!n) return;
    try {
      await updateDoc(doc(getDb(), 'orgs', org.id), { seats: n });
      loadOrgs();
    } catch (e) {
      setMsg(`Denied: ${e.message}`);
    }
  }

  if (!ready || isAdmin === undefined) {
    return <Shell><p className="muted">Checking access…</p></Shell>;
  }
  if (!isAdmin) {
    return (
      <Shell>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          This console is for the Folio founder. If that’s you, sign in with the
          account listed in <code>FOLIO_ADMIN_EMAILS</code> and in
          <code> firestore.rules → isFounder()</code>.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      {msg && (
        <p style={{ fontSize: 13.5, padding: '8px 12px', background: 'var(--accent-tint)', borderRadius: 8, marginBottom: 16 }}>
          {msg}
        </p>
      )}

      <PaymentsCheck />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20 }}>Workspaces ({orgs.length})</h2>
        <button className="btn btn-ghost btn-sm" onClick={loadOrgs}>↻ Refresh</button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {orgs.map((o) => (
          <div key={o.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                  {o.name}{' '}
                  <span className={`pill ${o.plan === 'business' || o.plan === 'businessPlus' ? 'pill-gold' : 'pill-muted'}`} style={{ fontSize: 11 }}>
                    {o.plan === 'businessPlus' ? 'business plus' : o.plan}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                  {o.type} · seats {o.seats} · student code <b>{o.joinCode}</b> · mentor code <b>{o.counselorCode}</b>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {o.plan !== 'free' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setOrgPlan(o, 'free')}>↓ Free</button>
                )}
                {o.plan !== 'business' && (
                  <button className="btn btn-gold btn-sm" onClick={() => setOrgPlan(o, 'business')}>Business</button>
                )}
                {o.plan !== 'businessPlus' && (
                  <button className="btn btn-gold btn-sm" onClick={() => setOrgPlan(o, 'businessPlus')}>Plus</button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setSeats(o)}>Seats</button>
              </div>
            </div>
          </div>
        ))}
        {orgs.length === 0 && <p className="muted">No workspaces yet.</p>}
      </div>

      <GrantPro onMsg={setMsg} />
    </Shell>
  );
}

// Dodo reconciliation on demand (the same pass runs daily via Vercel Cron):
// switches on any paid plan that never landed, and lists payments it could
// not attach to an account — refund those or activate them by hand below.
function PaymentsCheck() {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState('');

  async function run() {
    setBusy(true);
    setErr('');
    try {
      setReport(await apiPost('/api/admin/billing-sync', {}));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const problems = report ? report.unmatched.length + report.duplicates.length + report.errors.length : 0;
  return (
    <div className="card card-pad" style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 17 }}>Payments check</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            Compares every Dodo subscription with Folio plans and fixes the gaps. Runs daily on its own.
          </p>
        </div>
        <button className="btn btn-gold btn-sm" disabled={busy} onClick={run}>
          {busy ? 'Checking…' : 'Check payments now'}
        </button>
      </div>
      {err && <p style={{ color: 'var(--bad)', fontSize: 13.5, marginTop: 12 }}>{err}</p>}
      {report && (
        <div style={{ fontSize: 13.5, marginTop: 14, lineHeight: 1.6 }}>
          <p>
            Checked {report.checked} subscriptions · fixed {report.fixed.length} ·{' '}
            {problems ? <b style={{ color: 'var(--bad)' }}>{problems} need you</b> : 'all good'}
          </p>
          {report.fixed.map((f) => (
            <p key={f.subscriptionId} className="muted">✓ {f.action === 'grant' ? 'activated' : 'ended'} {f.plan} for {f.email || f.uid}</p>
          ))}
          {report.unmatched.map((u) => (
            <p key={u.subscriptionId} style={{ color: 'var(--bad)' }}>
              ⚠ Paid {u.plan}, no Folio account for <b>{u.email || 'unknown email'}</b> ({u.subscriptionId}) — ask them to sign in with that email, then run again; or refund in Dodo.
            </p>
          ))}
          {report.duplicates.map((d) => (
            <p key={d.uid + d.plan} style={{ color: 'var(--bad)' }}>
              ⚠ Account {d.uid} pays for {d.plan} {d.subscriptionIds.length}× ({d.subscriptionIds.join(', ')}) — cancel and refund the extra one in Dodo.
            </p>
          ))}
          {report.errors.map((x) => (
            <p key={x.subscriptionId} style={{ color: 'var(--bad)' }}>⚠ {x.subscriptionId}: {x.error}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// Grant/revoke individual Pro (students who pay directly).
function GrantPro({ onMsg }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  async function grant(plan) {
    const db = getDb();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email.trim())));
      if (snap.empty) {
        onMsg(`No user with email ${email} (they must sign in once first).`);
      } else {
        await updateDoc(doc(db, 'users', snap.docs[0].id), { plan });
        onMsg(`${email} → ${plan}`);
      }
    } catch (e) {
      onMsg(`Denied: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card-pad" style={{ marginTop: 26 }}>
      <h3 style={{ fontSize: 17 }}>Grant student Pro</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        For direct Pro sales. The student must have signed in at least once.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <input
          style={{ flex: 1, minWidth: 220 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@gmail.com"
        />
        <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => grant('pro')}>→ Pro</button>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => grant('free')}>→ Free</button>
      </div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="wrap" style={{ maxWidth: 720, padding: '44px 24px 100px' }}>
      <span className="pill pill-gold">Founder console</span>
      <h1 style={{ fontSize: 30, marginTop: 12, marginBottom: 24 }}>Orgs & plans</h1>
      {children}
    </div>
  );
}
