'use client';

// Shared data layer for the Business Workspace (/business/*). One provider
// mounted in app/business/layout.js loads the org, roster and student
// portfolio summaries once; every tab reads from context instead of
// re-fetching per page.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAccount } from '@/lib/account';
import { useOrg, useMembers, useOrgInvites } from '@/lib/org';
import { studentSummary, stepToString } from '@/lib/insights';
import { upcomingDeadlines } from '@/lib/deadlines';
import { orgSeatLimit, isOrgPaidPlan } from '@/lib/plans';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user, ready, profile } = useAccount();
  const orgId = profile?.orgId || null;
  const { org, ready: orgReady } = useOrg(orgId);
  const { members, ready: membersReady } = useMembers(orgId);
  const invites = useOrgInvites(orgId);

  const students = useMemo(() => members.filter((m) => m.role === 'student'), [members]);
  const staff = useMemo(
    () => members.filter((m) => m.role === 'counselor' || m.role === 'orgAdmin'),
    [members]
  );

  // Pull each student's portfolio (staff read allowed by rules) → roster rows.
  const [rows, setRows] = useState([]);
  const [rowsReady, setRowsReady] = useState(false);
  useEffect(() => {
    const db = getDb();
    if (!db || !students.length) {
      setRows([]);
      setRowsReady(membersReady);
      return;
    }
    let cancelled = false;
    setRowsReady(false);
    (async () => {
      const out = await Promise.all(
        students.map(async (m) => {
          try {
            const snap = await getDoc(doc(db, 'portfolios', m.uid));
            const raw = snap.exists() ? snap.data() : null;
            const data = raw?.data || null;
            return {
              uid: m.uid,
              email: m.email,
              displayName: m.displayName,
              joinedAt: m.joinedAt,
              updatedAt: raw?.updatedAt || null,
              summary: studentSummary(data),
              deadlines: upcomingDeadlines(data?.trackedDeadlines || []),
            };
          } catch {
            return {
              uid: m.uid,
              email: m.email,
              displayName: m.displayName,
              joinedAt: m.joinedAt,
              updatedAt: null,
              summary: studentSummary(null),
              deadlines: [],
              denied: true,
            };
          }
        })
      );
      if (!cancelled) {
        setRows(out);
        setRowsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [students, membersReady]);

  const isStaff =
    Boolean(orgId) && (profile?.role === 'counselor' || profile?.role === 'orgAdmin');
  const isAdmin =
    Boolean(orgId) && (profile?.role === 'orgAdmin' || org?.ownerUid === user?.uid);

  const value = {
    user,
    ready: ready && (orgId ? orgReady : true),
    profile,
    org,
    orgId,
    members,
    membersReady,
    students,
    staff,
    rows,
    rowsReady,
    isStaff,
    isAdmin,
    invites,
    paid: isOrgPaidPlan(org?.plan),
    seatLimit: orgSeatLimit(org),
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside /business (WorkspaceProvider)');
  return ctx;
}

// Display name for a roster row (portfolio name wins, then membership).
export function rowName(r) {
  return r.summary.name === '—' ? r.displayName || r.email || 'Student' : r.summary.name;
}

// Cohort aggregates for Overview + Analytics.
export function cohortStats(rows) {
  const n = rows.length;
  if (!n) {
    return {
      n: 0, avgStrength: 0, avgCompleteness: 0, needsAttention: 0,
      bands: { weak: 0, developing: 0, solid: 0, strong: 0 },
      flagCounts: [], grades: {}, active7: 0, active30: 0, deadlinesSoon: [],
    };
  }
  const now = Date.now();
  const bands = { weak: 0, developing: 0, solid: 0, strong: 0 };
  const flagMap = new Map();
  const grades = {};
  let strengthSum = 0;
  let completenessSum = 0;
  let needsAttention = 0;
  let active7 = 0;
  let active30 = 0;
  const deadlinesSoon = [];

  for (const r of rows) {
    const s = r.summary;
    strengthSum += s.strength;
    completenessSum += s.completeness;
    if (s.flags.some((f) => f.severity === 'bad')) needsAttention += 1;
    if (s.strength >= 75) bands.strong += 1;
    else if (s.strength >= 50) bands.solid += 1;
    else if (s.strength >= 30) bands.developing += 1;
    else bands.weak += 1;
    for (const f of s.flags) flagMap.set(f.label, (flagMap.get(f.label) || 0) + 1);
    const g = s.grade || '—';
    grades[g] = (grades[g] || 0) + 1;
    if (r.updatedAt) {
      const age = now - r.updatedAt;
      if (age <= 7 * 864e5) active7 += 1;
      if (age <= 30 * 864e5) active30 += 1;
    }
    for (const d of r.deadlines) {
      if (d.days <= 60) deadlinesSoon.push({ ...d, student: rowName(r), uid: r.uid });
    }
  }
  deadlinesSoon.sort((a, b) => a.days - b.days);

  return {
    n,
    avgStrength: Math.round(strengthSum / n),
    avgCompleteness: Math.round(completenessSum / n),
    needsAttention,
    bands,
    flagCounts: [...flagMap.entries()].sort((a, b) => b[1] - a[1]),
    grades,
    active7,
    active30,
    deadlinesSoon,
  };
}

// Roster CSV (paid feature — caller gates).
export function rosterCsv(rows) {
  const head = ['Name', 'Email', 'Grade', 'Major', 'Strength', 'Completeness %', 'Flags', 'Next steps', 'Last active'];
  const lines = rows.map((r) => {
    const s = r.summary;
    return [
      rowName(r),
      r.email || '',
      s.grade,
      s.major,
      s.strength,
      s.completeness,
      s.flags.map((f) => f.label).join('; '),
      s.steps.map(stepToString).join('; '),
      r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : '',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });
  return '﻿' + [head.join(','), ...lines].join('\n');
}
