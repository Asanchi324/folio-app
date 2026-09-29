#!/usr/bin/env node
// Import US universities from the U.S. Department of Education College
// Scorecard (public domain, api.data.gov) → lib/universities.generated.js.
//
//   SCORECARD_API_KEY=… npm run data:universities
//
// Get a free key in a minute at https://api.data.gov/signup (1,000 req/hour).
// Without one the script uses DEMO_KEY (10 req/hour) — it caches every page in
// scripts/.cache and resumes where it stopped, so you can simply run it again.
//
// Pulled per school (all real, published data):
//   admission rate · SAT 25th/75th (R+W and Math) · ACT 25th/75th ·
//   test policy (required / recommended / considered / not considered) ·
//   undergrad size · international share · out-of-state tuition · public/private · website
// Derived (clearly marked in `derived`): admitted GPA and English minimums —
// Scorecard doesn't publish them, so they're estimated from selectivity.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'scripts/.cache/scorecard');
const OUT = path.join(ROOT, 'lib/universities.generated.js');
const KEY = process.env.SCORECARD_API_KEY || 'DEMO_KEY';
const PER_PAGE = 100;

const FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.school_url',
  'school.ownership',
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.25th_percentile.critical_reading',
  'latest.admissions.sat_scores.75th_percentile.critical_reading',
  'latest.admissions.sat_scores.25th_percentile.math',
  'latest.admissions.sat_scores.75th_percentile.math',
  'latest.admissions.act_scores.25th_percentile.cumulative',
  'latest.admissions.act_scores.75th_percentile.cumulative',
  'latest.admissions.test_requirements',
  'latest.student.size',
  'latest.student.demographics.race_ethnicity.non_resident_alien',
  'latest.cost.tuition.out_of_state',
].join(',');

// pass 'sat': schools that report SAT ranges. pass 'blind': test-blind
// schools (they don't report SAT at all — e.g. the University of California).
function url(page, pass = 'sat') {
  const q = new URLSearchParams({
    api_key: KEY,
    fields: FIELDS,
    per_page: String(PER_PAGE),
    page: String(page),
    sort: 'latest.admissions.admission_rate.overall:asc',
    'school.degrees_awarded.predominant': '3', // bachelor's-granting
    'school.operating': '1',
    'latest.admissions.admission_rate.overall__range': '0.01..1',
    'latest.student.size__range': '500..', // skip tiny/specialised schools
    ...(pass === 'blind'
      ? { 'latest.admissions.test_requirements': '3', 'latest.admissions.admission_rate.overall__range': '0.01..0.7' }
      : { 'latest.admissions.sat_scores.75th_percentile.math__range': '200..800' }),
  });
  return `https://api.data.gov/ed/collegescorecard/v1/schools?${q}`;
}

async function fetchPage(page, pass = 'sat') {
  const file = path.join(CACHE, `${pass === 'sat' ? '' : `${pass}-`}page-${page}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const res = await fetch(url(page, pass));
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) throw new Error(`Scorecard ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
  return data;
}

const slug = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Estimates for fields Scorecard doesn't publish. Kept deliberately simple
// and monotonic in selectivity; the UI labels them as estimates.
function derive(rate, satMidpoint) {
  const gpa = rate < 8 ? 3.93 : rate < 15 ? 3.88 : rate < 25 ? 3.8 : rate < 40 ? 3.7 : rate < 60 ? 3.55 : 3.4;
  const bump = satMidpoint >= 1500 ? 0.02 : satMidpoint < 1150 ? -0.1 : 0;
  return {
    gpaAvg: Math.round(Math.min(4, gpa + bump) * 100) / 100,
    ieltsMin: rate < 15 ? 7 : rate < 40 ? 6.5 : 6,
    toeflMin: rate < 15 ? 100 : rate < 40 ? 90 : 80,
  };
}

const TEST_POLICY = { 1: 'required', 2: 'recommended', 3: 'not-considered', 5: 'optional' };

function toUniversity(r, fetched) {
  const g = (k) => r[k];
  const rate = g('latest.admissions.admission_rate.overall');
  const rw25 = g('latest.admissions.sat_scores.25th_percentile.critical_reading');
  const rw75 = g('latest.admissions.sat_scores.75th_percentile.critical_reading');
  const m25 = g('latest.admissions.sat_scores.25th_percentile.math');
  const m75 = g('latest.admissions.sat_scores.75th_percentile.math');
  const policy = TEST_POLICY[g('latest.admissions.test_requirements')] || null;
  if (!rate) return null;
  if ((!m25 || !m75) && policy !== 'not-considered') return null;
  const acceptRate = Math.round(rate * 1000) / 10;
  // Some schools report only Math; approximate R+W with Math in that case.
  // Test-blind schools have no SAT range at all (satMid: null).
  const satMid = m25 && m75 ? [Math.round((m25 + (rw25 || m25)) / 10) * 10, Math.round((m75 + (rw75 || m75)) / 10) * 10] : null;
  const est = derive(acceptRate, satMid ? (satMid[0] + satMid[1]) / 2 : 1300);
  const ownership = g('school.ownership') === 1 ? 'Public' : 'Private';
  const site = g('school.school_url');
  const intl = g('latest.student.demographics.race_ethnicity.non_resident_alien');
  const act25 = g('latest.admissions.act_scores.25th_percentile.cumulative');
  const act75 = g('latest.admissions.act_scores.75th_percentile.cumulative');
  return {
    id: slug(g('school.name')),
    scorecardId: g('id'),
    name: g('school.name'),
    country: 'USA',
    location: `${g('school.city')}, ${g('school.state')}`,
    state: g('school.state'),
    acceptRate,
    satMid,
    ...(act25 && act75 ? { actMid: [act25, act75] } : {}),
    ...est,
    derived: ['gpaAvg', 'ieltsMin', 'toeflMin'],
    testPolicy: policy,
    size: g('latest.student.size') || null,
    intlShare: intl != null ? Math.round(intl * 1000) / 10 : null,
    tuition: g('latest.cost.tuition.out_of_state') || null,
    ownership,
    url: site ? (site.startsWith('http') ? site : `https://${site}`) : null,
    tags: [ownership, g('school.state')],
    source: `College Scorecard (${fetched})`,
  };
}

async function main() {
  const fetched = new Date().toISOString().slice(0, 10);
  const rows = [];
  let stoppedEarly = false;
  for (const pass of ['blind', 'sat']) {
    let page = 0;
    let total = null;
    for (;;) {
      const data = await fetchPage(page, pass);
      if (data.rateLimited) {
        stoppedEarly = true;
        break;
      }
      total = data.metadata?.total ?? total;
      rows.push(...(data.results || []));
      process.stdout.write(`${pass}: page ${page + 1}${total ? ` / ${Math.ceil(total / PER_PAGE)}` : ''}\r`);
      if (!data.results?.length || (page + 1) * PER_PAGE >= (total || 0)) break;
      page += 1;
    }
    console.log('');
    // On a rate limit, still move on: the next pass may be fully cached.
  }

  const seen = new Set();
  const unis = [];
  for (const r of rows) {
    const u = toUniversity(r, fetched);
    if (!u || seen.has(u.id)) continue;
    seen.add(u.id);
    unis.push(u);
  }
  if (!unis.length) {
    console.error('Nothing imported (rate limited before the first page?). Try again later or set SCORECARD_API_KEY.');
    process.exit(1);
  }

  const header = `// AUTO-GENERATED by scripts/import-scorecard.mjs — do not edit by hand.
// Source: U.S. Dept. of Education College Scorecard (public domain), fetched ${fetched}.
// Real: admission rate, SAT/ACT mid-50%, test policy, size, international
// share, tuition. Estimated (listed in \`derived\`): gpaAvg, ieltsMin, toeflMin.
// ${unis.length} schools${stoppedEarly ? ` — PARTIAL import (rate limited); run again to continue` : ''}.

export const GENERATED_UNIVERSITIES = `;
  // One school per line: compact, and diffs stay readable on re-import.
  fs.writeFileSync(OUT, `${header}[\n${unis.map((u) => `  ${JSON.stringify(u)}`).join(',\n')}\n];\n`);
  console.log(`✓ ${unis.length} US universities → lib/universities.generated.js${stoppedEarly ? ' (partial: API rate limit — run again in an hour or with SCORECARD_API_KEY)' : ''}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
