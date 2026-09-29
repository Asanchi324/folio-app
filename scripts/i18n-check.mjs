#!/usr/bin/env node
// Finds every translatable string in the code and reports keys missing from
// lib/locales/{ru,kk}.js.  `npm run i18n:check` (add --json to dump keys).
//
// Extracted: first string argument of t(…), tr(…), msg(…); plus the
// data-driven labels the UI passes through t() (label:/note:/tagline:/period:
// values, plan bullets, pricing checks, deadline labels, categories).

import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['app', 'components', 'lib'];
const SKIP = /locales|\.generated\.|universities\.js$|competitions\.js$|node_modules/;

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (/\.(js|mjs)$/.test(f.name) && !SKIP.test(p)) out.push(p);
  }
  return out;
}

// JS string literal body → value (handles \' \" \n).
const unescape = (s) => s.replace(/\\n/g, '\n').replace(/\\(['"`\\])/g, '$1');
const STR = String.raw`'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"`;

const keys = new Set();
// weak = found by the loose array/line patterns, where a bare lowercase word
// is almost always an identifier ('general', 'student'), not UI text.
const add = (s, weak = false) => {
  if (!s || !/[A-Za-z]/.test(s) || s.length < 2) return;
  if (weak && /^[a-z]+$/.test(s)) return;
  keys.add(s);
};

// User-facing API errors are shown through t(e.message) on the client.
const INTERNAL = /webhook|signature|payload|server not configured|unauthorized|apply failed|Invalid request body|No portfolio provided|Nothing to enhance|Unknown plan|Invalid session|Not your session|Reminder delivery/i;

for (const file of DIRS.flatMap((d) => walk(path.join(ROOT, d)))) {
  const src = fs.readFileSync(file, 'utf8');
  if (/[\\/]api[\\/]|ratelimit\.js$/.test(file)) {
    for (const m of src.matchAll(new RegExp(String.raw`error:\s*(?:${STR})`, 'g'))) {
      const v = unescape(m[1] ?? m[2]);
      if (!INTERNAL.test(v)) add(v);
    }
    continue;
  }
  for (const m of src.matchAll(new RegExp(String.raw`(?<![.\w])(?:t|tr|msg|add)\(\s*(?:${STR})`, 'g'))) add(unescape(m[1] ?? m[2]));
  for (const m of src.matchAll(new RegExp(String.raw`\b(?:label|note|tagline|period|title|text):\s*(?:${STR})`, 'g'))) add(unescape(m[1] ?? m[2]));
  // Plan bullets + pricing checks + static label tables: string items in arrays of pairs.
  if (/plans\.js$|Pricing\.js$|competitions|start\/page\.js$|workspace|insights|comments\.js$/.test(file)) {
    for (const m of src.matchAll(new RegExp(String.raw`\[\s*(?:${STR})\s*,\s*(?:${STR})`, 'g'))) {
      add(unescape(m[1] ?? m[2] ?? ''), true);
      add(unescape(m[3] ?? m[4] ?? ''), true);
    }
    for (const m of src.matchAll(new RegExp(String.raw`^\s*(?:${STR}),?\s*$`, 'gm'))) add(unescape(m[1] ?? m[2]), true);
  }
  // Lookup tables like { key: 'Label' } inside *_LABEL / *_TEXT / *_META consts.
  for (const block of src.matchAll(/const [A-Z_]+(?:LABEL|TEXT|NOTE|SIGNAL)[A-Z_]* = \{([\s\S]*?)\};/g)) {
    for (const m of block[1].matchAll(new RegExp(String.raw`:\s*(?:${STR})`, 'g'))) add(unescape(m[1] ?? m[2]));
  }
}

// Things that are identifiers, not UI text.
const NOISE = /^(use client|[a-z]+(-[a-z]+)+|[a-z]+[A-Z]\w*|[A-Z_]+|https?:.*|\/.*|[a-z]+\.[a-z.]+|.*\.js|GPA|SAT|ACT|IELTS|TOEFL|Pro|Folio|USA|UK)$/;
const all = [...keys].filter((k) => !NOISE.test(k)).sort();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(all, null, 1));
  process.exit(0);
}

let failed = false;
for (const lang of ['ru', 'kk']) {
  const src = fs.readFileSync(path.join(ROOT, 'lib/locales', `${lang}.js`), 'utf8');
  const dict = new Function(src.replace(/export default \w+;?/, '').replace(/^const \w+ =/m, 'return') )();
  const missing = all.filter((k) => !(k in dict));
  const orphan = Object.keys(dict).filter((k) => !keys.has(k));
  // Placeholders must survive translation.
  const broken = all.filter((k) => k in dict && JSON.stringify((k.match(/\{\w+\}/g) || []).sort()) !== JSON.stringify((dict[k].match(/\{\w+\}/g) || []).sort()));
  console.log(`${lang}: ${all.length - missing.length}/${all.length} translated, ${missing.length} missing, ${orphan.length} unused, ${broken.length} placeholder mismatches`);
  if (process.argv.includes('--missing')) missing.forEach((k) => console.log('  - ' + JSON.stringify(k)));
  broken.forEach((k) => console.log('  ! placeholders: ' + JSON.stringify(k)));
  if (missing.length || broken.length) failed = true;
}
process.exit(failed ? 1 : 0);
