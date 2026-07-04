// Server-side rate limiting for the AI routes (/api/enhance, /api/feedback).
//
// Without this, a single script can hammer an endpoint and burn the whole daily
// quota of our AI providers (Groq / OpenRouter / Gemini) — taking the product
// down for everyone. This caps how often one client can call the AI.
//
// Pluggable backend:
//   1. In-memory (default) — zero setup. On Vercel serverless each warm instance
//      keeps its own counters, so it is not a globally exact limit. But it still
//      absorbs the case that actually matters — one client repeatedly calling an
//      endpoint — because those repeat calls land on the same warm instance.
//      Good enough as a baseline with no external service.
//   2. Upstash Redis (optional) — if UPSTASH_REDIS_REST_URL and
//      UPSTASH_REDIS_REST_TOKEN are set, we use a durable, globally-shared
//      counter instead. Recommended once traffic grows. Get free creds at
//      upstash.com → Redis → REST API.
//
// The limiter fails OPEN: if the backend errors, we allow the request rather
// than block a paying user over a limiter hiccup (we still have provider-side
// quotas as the backstop).

const HAS_UPSTASH = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// ---- in-memory store -------------------------------------------------------
// key -> { count, reset(ms epoch) }. Swept lazily so it can't grow unbounded.
const MEM = new Map();
const MEM_MAX = 5000;

function memSweep(now) {
  if (MEM.size < MEM_MAX) return;
  for (const [k, v] of MEM) if (v.reset <= now) MEM.delete(k);
}

function memHit(key, limit, windowMs) {
  const now = Date.now();
  const e = MEM.get(key);
  if (!e || e.reset <= now) {
    memSweep(now);
    MEM.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  e.count += 1;
  if (e.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((e.reset - now) / 1000) };
  }
  return { ok: true, remaining: limit - e.count, retryAfter: 0 };
}

// ---- Upstash store ---------------------------------------------------------
// INCR the key; on the first hit (count === 1) set a TTL so the window resets.
// One pipelined round-trip. Any error → caller falls back to memory.
async function upstashHit(key, limit, windowMs) {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, windowMs, 'NX'],
    ]),
    // Never let a slow limiter stall the actual request for long.
    signal: AbortSignal.timeout(1500),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const out = await res.json();
  const count = out?.[0]?.result;
  if (typeof count !== 'number') throw new Error('upstash bad response');
  if (count > limit) {
    // We don't know the exact remaining TTL cheaply; approximate with the window.
    return { ok: false, remaining: 0, retryAfter: Math.ceil(windowMs / 1000) };
  }
  return { ok: true, remaining: limit - count, retryAfter: 0 };
}

async function hit(key, limit, windowMs) {
  if (HAS_UPSTASH) {
    try {
      return await upstashHit(key, limit, windowMs);
    } catch (e) {
      console.warn('[ratelimit] upstash failed, using memory:', e?.message);
    }
  }
  return memHit(key, limit, windowMs);
}

// ---- public API ------------------------------------------------------------

// Best-effort client identifier. On Vercel the real client IP is the first
// entry of x-forwarded-for. Falls back to a shared bucket if absent (so an
// attacker can't dodge the limit by stripping headers — they just share it).
export function clientId(request) {
  const xff = request.headers.get('x-forwarded-for') || '';
  const ip = xff.split(',')[0].trim();
  return ip || request.headers.get('x-real-ip') || 'anon';
}

// Enforce a burst window + a daily cap for one named endpoint. Returns null when
// allowed, or a { status, body, retryAfter } to send back when limited.
//
//   limits: { burst: { limit, windowMs }, daily: { limit } }
export async function enforce(request, name, limits) {
  const id = clientId(request);
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  const checks = [];
  if (limits.burst) {
    checks.push(hit(`rl:${name}:b:${id}`, limits.burst.limit, limits.burst.windowMs));
  }
  if (limits.daily) {
    // Fixed daily window: key includes the date, so it resets at UTC midnight.
    checks.push(hit(`rl:${name}:d:${id}:${day}`, limits.daily.limit, 24 * 60 * 60 * 1000));
  }

  const results = await Promise.all(checks);
  const blocked = results.find((r) => !r.ok);
  if (!blocked) return null;

  const retryAfter = blocked.retryAfter || 60;
  return {
    status: 429,
    retryAfter,
    body: {
      error:
        'You’ve hit the limit of free AI requests for now. Take a short break and try again soon.',
    },
  };
}
