// Provider-agnostic text generation with automatic fallover.
//
// Folio's Google account is restricted to "AQ." Gemini keys (capped at ~20
// requests/day), so Gemini alone isn't enough for a free product. We chain
// several free providers and fall through on quota/errors:
//
//   1. Groq        — free, no card, very generous daily limits, very fast.
//   2. OpenRouter  — free models (Llama / DeepSeek / etc.), one endpoint.
//   3. Gemini      — last resort (works only with a proper "AIza" key).
//
// Add a key for any provider to .env.local and it joins the chain automatically;
// leave it blank and it's skipped. You don't need all three.
import { GoogleGenAI } from '@google/genai';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- Response cache --------------------------------------------------------
// Identical prompts (the same activity text rewritten, or a feedback run on an
// unchanged profile) return the stored answer instead of spending a provider
// request. In-memory and per-instance: it clears on redeploy / cold start,
// which is fine — its job is to absorb duplicate and rapid-repeat calls (double
// clicks, "regenerate", two students with the same draft), not to be a durable
// store. TTL bounds staleness; the size cap bounds memory.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CACHE_MAX = 500;
const _cache = new Map(); // key -> { text, at }

function cacheKey({ prompt, system, json }) {
  const raw = `${json ? 1 : 0} ${system || ''} ${prompt || ''}`;
  // Small, fast, non-crypto FNV-1a hash. A collision is astronomically unlikely
  // at our volume, and would only mean one stale cache hit — not a correctness
  // risk worth a crypto dependency.
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function cacheGet(key) {
  const hit = _cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  // Refresh LRU position so hot entries survive eviction.
  _cache.delete(key);
  _cache.set(key, hit);
  return hit.text;
}

function cacheSet(key, text) {
  _cache.set(key, { text, at: Date.now() });
  if (_cache.size > CACHE_MAX) {
    const oldest = _cache.keys().next().value; // Map keeps insertion order.
    _cache.delete(oldest);
  }
}

function isQuotaError(e) {
  const status = e?.status || e?.code;
  return (
    status === 429 ||
    /quota|rate limit|resource_exhausted|exhausted|too many requests/i.test(
      e?.message || ''
    )
  );
}

// ---- OpenAI-compatible providers (Groq, OpenRouter) -----------------------
// Both speak the OpenAI /chat/completions shape, so one helper covers both.
async function chatCompletion({ baseURL, apiKey, model, prompt, system, json, headers, temperature = 0.6 }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  // Nudge toward clean JSON without relying on response_format, which not all
  // free models support. Callers already parse loosely.
  const userContent = json
    ? `${prompt}\n\nRespond with ONLY valid JSON. No markdown, no commentary.`
    : prompt;
  messages.push({ role: 'user', content: userContent });

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...headers,
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status}: ${detail.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

// Try each model for an OpenAI-compatible provider, with one quota retry.
async function runOpenAICompat(cfg, { prompt, system, json, temperature }) {
  let lastError = null;
  for (const model of cfg.models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await chatCompletion({ ...cfg, model, prompt, system, json, temperature });
        if (text) return text;
      } catch (e) {
        lastError = e;
        if (isQuotaError(e) && attempt === 0) {
          await sleep(500);
          continue;
        }
        break; // move to next model
      }
    }
  }
  throw lastError || new Error('No text from provider');
}

// ---- Gemini (Google GenAI SDK) --------------------------------------------
// Quota is per Google Cloud PROJECT, so multiple keys (one per project) stack.
function loadGeminiKeys() {
  const keys = [];
  const csv = process.env.GEMINI_API_KEYS;
  if (csv) keys.push(...csv.split(',').map((k) => k.trim()).filter(Boolean));
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY.trim());
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k) keys.push(k.trim());
  }
  return [...new Set(keys)];
}

const geminiClients = new Map();
function geminiClient(key) {
  if (!geminiClients.has(key)) geminiClients.set(key, new GoogleGenAI({ apiKey: key }));
  return geminiClients.get(key);
}

async function runGemini({ prompt, system, json, temperature, smart }) {
  const keys = loadGeminiKeys();
  // smart: conversation quality matters more than speed/cost (the counselor),
  // so the full Flash model goes first instead of Flash-Lite.
  const models = smart
    ? ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']
    : ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  const config = {};
  if (system) config.systemInstruction = system;
  if (json) config.responseMimeType = 'application/json';
  if (temperature != null) config.temperature = temperature;

  let lastError = null;
  for (const model of models) {
    for (const key of keys) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await geminiClient(key).models.generateContent({
            model,
            contents: prompt,
            config,
          });
          const text = response.text || '';
          if (text) return text;
        } catch (e) {
          lastError = e;
          if (isQuotaError(e) && attempt === 0) {
            await sleep(500);
            continue;
          }
          break; // next key
        }
      }
    }
  }
  throw lastError || new Error('No text from Gemini');
}

// ---- Provider chain --------------------------------------------------------
function buildChain() {
  const chain = [];

  if (process.env.GROQ_API_KEY) {
    chain.push({
      name: 'groq',
      run: (args) =>
        runOpenAICompat(
          {
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY,
            // gpt-oss-120b is Groq's smartest free model (1000 req/day);
            // gpt-oss-20b is the lighter, even-faster fallback. The old Llama
            // 3.x models were deprecated by Groq in June 2026.
            models: (process.env.GROQ_MODEL
              ? [process.env.GROQ_MODEL]
              : ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']),
          },
          args
        ),
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    chain.push({
      name: 'openrouter',
      run: (args) =>
        runOpenAICompat(
          {
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY,
            // Free model slugs drift — override with OPENROUTER_MODEL if one 404s.
            // Browse current free models at openrouter.ai/models?max_price=0
            models: (process.env.OPENROUTER_MODEL
              ? [process.env.OPENROUTER_MODEL]
              : [
                  'meta-llama/llama-3.3-70b-instruct:free',
                  'deepseek/deepseek-chat-v3-0324:free',
                ]),
            headers: {
              'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://folio.app',
              'X-Title': 'Folio',
            },
          },
          args
        ),
    });
  }

  if (loadGeminiKeys().length > 0) {
    chain.push({ name: 'gemini', run: runGemini });
  }

  return chain;
}

// Single place the rest of the app calls. Returns plain text.
// Pass cache:false to force a fresh generation (e.g. a "give me another" button).
// temperature: optional override (default 0.6 for chat providers).
// smart: prefer the stronger model where a provider offers a choice.
export async function generate({ prompt, system, json = false, cache = true, temperature, smart = false }) {
  const chain = buildChain();
  if (chain.length === 0) {
    throw new Error(
      'No AI provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY in .env.local.'
    );
  }

  const key = cache ? cacheKey({ prompt, system, json }) : null;
  if (key) {
    const cached = cacheGet(key);
    if (cached) return cached;
  }

  let lastError = null;
  for (const provider of chain) {
    try {
      const text = await provider.run({ prompt, system, json, temperature, smart });
      if (text) {
        if (key) cacheSet(key, text);
        return text;
      }
    } catch (e) {
      lastError = e;
      console.warn(`[ai] provider "${provider.name}" failed:`, e?.message);
      // fall through to the next provider
    }
  }
  throw lastError || new Error('All AI providers failed.');
}
