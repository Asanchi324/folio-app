// Pure helpers for the profile page: link kinds, avatar, headline, short
// university names. No heavy imports — used by the public share page, the
// in-app profile and the /api/peers route alike.

// ---------------------------------------------------------------- links

const LINK_KINDS = [
  { kind: 'linkedin', label: 'LinkedIn', re: /(^|\.)linkedin\.com$/i },
  { kind: 'telegram', label: 'Telegram', re: /(^|\.)(t\.me|telegram\.me|telegram\.org)$/i },
  { kind: 'instagram', label: 'Instagram', re: /(^|\.)instagram\.com$/i },
  { kind: 'github', label: 'GitHub', re: /(^|\.)github\.(com|io)$/i },
  { kind: 'youtube', label: 'YouTube', re: /(^|\.)(youtube\.com|youtu\.be)$/i },
  { kind: 'tiktok', label: 'TikTok', re: /(^|\.)tiktok\.com$/i },
  { kind: 'x', label: 'X', re: /(^|\.)(x\.com|twitter\.com)$/i },
];

// "t.me/aisha" → "https://t.me/aisha". Returns '' for anything that isn't a
// plain http(s) URL (no javascript:, data:, mailto: on a public page).
export function normalizeUrl(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  if (s.startsWith('@')) s = `https://t.me/${s.slice(1)}`;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
    if (!u.hostname.includes('.')) return '';
    return u.toString();
  } catch {
    return '';
  }
}

export function linkInfo(raw) {
  const url = normalizeUrl(raw);
  if (!url) return null;
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./i, '');
  const hit = LINK_KINDS.find((k) => k.re.test(host));
  const path = u.pathname.replace(/\/+$/, '');
  const handle = path && path !== '/' ? path.split('/').filter(Boolean).pop() : '';
  return {
    url,
    kind: hit ? hit.kind : 'website',
    label: hit ? hit.label : 'Website',
    host,
    // Shown under the tile title, e.g. t.me/aisha or aisha.dev.
    display: hit && handle ? `${host}/${handle}` : host,
  };
}

// Up to 6 valid, de-duplicated links.
export function cleanLinks(links) {
  const seen = new Set();
  const out = [];
  for (const l of Array.isArray(links) ? links : []) {
    const url = normalizeUrl(typeof l === 'string' ? l : l?.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= 6) break;
  }
  return out;
}

// ---------------------------------------------------------------- avatar

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const a = parts[0][0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

// Calm, readable avatar colours (white text passes AA on each).
const AVATAR = ['#3670bc', '#b8424f', '#267b54', '#8f631a', '#6a4fb3', '#0f7c8c', '#a3487e', '#4b5a6e'];

export function avatarColor(seed) {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR[Math.abs(h) % AVATAR.length];
}

// ---------------------------------------------------------------- universities

const SHORT = {
  'Massachusetts Institute of Technology': 'MIT',
  'California Institute of Technology': 'Caltech',
  'Carnegie Mellon University': 'CMU',
  'University of Pennsylvania': 'UPenn',
  'New York University': 'NYU',
  'University of California, Berkeley': 'UC Berkeley',
  'University of California-Berkeley': 'UC Berkeley',
  'University of California-Los Angeles': 'UCLA',
  'University of Southern California': 'USC',
  'Columbia University in the City of New York': 'Columbia',
  'Washington University in St Louis': 'WashU',
  'London School of Economics': 'LSE',
  'University College London': 'UCL',
  'Imperial College London': 'Imperial',
  'National University of Singapore': 'NUS',
  'Nanyang Technological University': 'NTU',
  'Hong Kong University of Science & Technology': 'HKUST',
  'Technical University of Munich': 'TUM',
  'University of British Columbia': 'UBC',
};

export function shortUniName(name) {
  const n = String(name || '').trim();
  if (SHORT[n]) return SHORT[n];
  let m = n.match(/^([A-Z][\w.'-]+) (University|College)$/);
  if (m) return m[1];
  m = n.match(/^University of ([A-Z][\w.'-]+)$/);
  if (m) return m[1];
  return n;
}

// ---------------------------------------------------------------- headline

// "Aspiring Computer Science student | Target: MIT, Stanford" — used when the
// student hasn't written their own. `targets` are names, best first.
export function autoHeadline({ intendedMajor, targets = [] } = {}, t = (s, v) => fill(s, v)) {
  const bits = [];
  const major = String(intendedMajor || '').trim();
  if (major) bits.push(t('Aspiring {major} student', { major }));
  const names = targets.slice(0, 3).map(shortUniName).filter(Boolean);
  if (names.length) bits.push(t('Target: {list}', { list: names.join(', ') }));
  return bits.join(' | ');
}

function fill(s, vars = {}) {
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

export function normMajor(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-zа-яёәғқңөұүһі0-9 ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}
