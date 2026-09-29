'use client';

// Shared data layer for the Business Workspace (/business/*). One provider
// mounted in app/business/layout.js loads the org, roster and student
// portfolio summaries once; every tab reads from context instead of
// re-fetching per page.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAccount } from '@/lib/account';
import { useOrg, useMembers, useOrgInvites } from '@/lib/org';
import { studentSummary } from '@/lib/insights';
import { upcomingDeadlines } from '@/lib/deadlines';
import { orgSeatLimit, isOrgPaidPlan } from '@/lib/plans';
import { cohortSignals, balancedAssignment } from '@/lib/cohort';

export { balancedAssignment, cohortStats, cohortTrend, counselorLoad, rowName, rosterCsv } from '@/lib/cohort';

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
              counselorUid: m.counselorUid || null,
              updatedAt: raw?.updatedAt || null,
              summary: studentSummary(data),
              deadlines: upcomingDeadlines(data?.trackedDeadlines || []),
              ...cohortSignals(data),
            };
          } catch {
            return {
              uid: m.uid,
              email: m.email,
              displayName: m.displayName,
              joinedAt: m.joinedAt,
              counselorUid: m.counselorUid || null,
              updatedAt: null,
              ...cohortSignals(null),
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

  // Admin setting: new students are spread evenly across counselors as soon
  // as an admin opens the workspace (the member doc is admin-writable).
  const autoAssign = Boolean(org?.settings?.autoAssign);
  useEffect(() => {
    const db = getDb();
    const admin = profile?.role === 'orgAdmin' || (org && org.ownerUid === user?.uid);
    if (!db || !autoAssign || !admin || !membersReady) return;
    const unassigned = students.filter((m) => !m.counselorUid);
    if (!unassigned.length) return;
    const staffIds = members.filter((m) => m.role === 'counselor' || m.role === 'orgAdmin').map((m) => m.uid);
    if (!staffIds.length) return;
    const plan = balancedAssignment(unassigned.map((m) => m.uid), staffIds, students);
    Promise.all(
      Object.entries(plan).map(([uid, c]) => updateDoc(doc(db, 'orgs', orgId, 'members', uid), { counselorUid: c }))
    ).catch(() => {});
  }, [autoAssign, students, members, membersReady, orgId, org, profile?.role, user?.uid]);

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
    quietDays: Number(org?.settings?.quietDays) || 14,
    seatLimit: orgSeatLimit(org),
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside /business (WorkspaceProvider)');
  return ctx;
}
// Assign (or clear, with null) a student's counselor. Admin-only by rules.
export async function assignCounselor(orgId, studentUid, counselorUid) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'orgs', orgId, 'members', studentUid), { counselorUid: counselorUid || null });
}
