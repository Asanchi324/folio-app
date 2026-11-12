// "Students like you" — signed-in students who opted in to being listed and
// aim for the same universities (or the same major). Reads shares/* with the
// service account, because clients can never list that collection; returns
// only what each listed student already made public in their snapshot.
import { NextResponse } from 'next/server';
import { bearerToken, verifyIdToken } from '@/lib/plan-server';
import { adminConfigured, adminQuery } from '@/lib/firestore-admin';
import { enforce } from '@/lib/ratelimit';
import { normMajor } from '@/lib/profile-card';

export const runtime = 'nodejs';

const MAX = 8;

export async function POST(request) {
  const who = await verifyIdToken(bearerToken(request));
  if (!who) return NextResponse.json({ error: 'Sign in to see students like you.' }, { status: 401 });

  const limited = await enforce(request, 'peers', { burst: { limit: 20, windowMs: 60 * 1000 }, daily: { limit: 400 } }, { id: who.uid });
  if (limited) {
    return NextResponse.json(limited.body, { status: limited.status, headers: { 'Retry-After': String(limited.retryAfter) } });
  }

  if (!adminConfigured()) return NextResponse.json({ peers: [], available: false });

  let body = {};
  try {
    body = await request.json();
  } catch {
    /* empty body → match by nothing, fall back to recent */
  }
  const targets = (Array.isArray(body.targets) ? body.targets : [])
    .filter((x) => typeof x === 'string' && /^[a-z0-9-]{2,80}$/i.test(x))
    .slice(0, 30);
  const major = normMajor(body.major);

  try {
    const found = new Map();
    const add = (rows) => rows.forEach((r) => found.set(r.id, r));
    const jobs = [];
    if (targets.length) jobs.push(adminQuery('shares', 'listedTargets', 'ARRAY_CONTAINS_ANY', targets, 60).then(add));
    if (major) jobs.push(adminQuery('shares', 'listedMajor', 'EQUAL', major, 30).then(add));
    await Promise.all(jobs);
    // Too few close matches → fill with other listed students so the block
    // is never empty while the community is small.
    if (found.size < 4) add(await adminQuery('shares', 'listed', 'EQUAL', true, 30));

    const mine = new Set(targets);
    const peers = [...found.values()]
      .filter((r) => r.listed === true && r.ownerUid !== who.uid && r.snapshot?.fullName)
      .map((r) => {
        const s = r.snapshot || {};
        const list = Array.isArray(s.targets) ? s.targets : [];
        const ordered = s.topChoice ? [...list.filter((u) => u.id === s.topChoice), ...list.filter((u) => u.id !== s.topChoice)] : list;
        const shared = ordered.filter((u) => mine.has(u.id));
        const sameMajor = Boolean(major) && r.listedMajor === major;
        return {
          shareId: r.id,
          name: String(s.fullName).slice(0, 80),
          headline: String(s.headline || '').slice(0, 140),
          major: String(s.intendedMajor || '').slice(0, 80),
          country: String(s.country || '').slice(0, 60),
          targetNames: ordered.slice(0, 3).map((u) => u.name),
          shared: shared.slice(0, 3).map((u) => u.name),
          sharedCount: shared.length,
          sameMajor,
          score: shared.length * 10 + (sameMajor ? 4 : 0) + Math.min(3, (Number(r.updatedAt) || 0) / 1e13),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX)
      .map(({ score, ...rest }) => rest);

    return NextResponse.json({ peers, available: true });
  } catch (e) {
    console.warn('[peers] query failed:', e?.message);
    return NextResponse.json({ peers: [], available: false });
  }
}
