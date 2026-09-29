// University dataset = a hand-curated set (marquee US schools with written
// blurbs + international schools the US dataset doesn't cover: Oxford, Cambridge,
// Imperial, Toronto) MERGED with ~76 US universities auto-generated from the
// U.S. Dept. of Education College Scorecard (see universities.generated.js).
// Used by the honest chance estimator in chances.js — real selectivity baked in.

import { GENERATED_UNIVERSITIES } from '@/lib/universities.generated';

const CURATED = [
  {
    id: 'harvard',
    name: 'Harvard University',
    country: 'USA',
    location: 'Cambridge, MA',
    rank: 1,
    acceptRate: 3.4,
    satMid: [1500, 1580],
    gpaAvg: 3.95,
    ieltsMin: 7.5,
    toeflMin: 100,
    tuition: 56000,
    tags: ['Ivy League', 'Research', 'Need-blind'],
    blurb:
      'The archetypal reach. Even near-perfect applicants are rejected — fit, story and institutional priorities decide the margin.',
  },
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    country: 'USA',
    location: 'Cambridge, MA',
    rank: 2,
    acceptRate: 4.5,
    satMid: [1520, 1580],
    gpaAvg: 3.96,
    ieltsMin: 7.0,
    toeflMin: 90,
    tuition: 57000,
    tags: ['STEM', 'Research', 'Maker culture'],
    blurb:
      'Wants demonstrated technical depth — olympiads, research, real builds. Raw scores are table stakes, not a differentiator.',
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    country: 'USA',
    location: 'Stanford, CA',
    rank: 3,
    acceptRate: 3.7,
    satMid: [1500, 1570],
    gpaAvg: 3.96,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 58000,
    tags: ['Reach', 'Entrepreneurship', 'Need-blind'],
    blurb:
      'Rewards intellectual vitality and an unusual angle. Generic excellence rarely clears the bar.',
  },
  {
    id: 'princeton',
    name: 'Princeton University',
    country: 'USA',
    location: 'Princeton, NJ',
    rank: 4,
    acceptRate: 4.5,
    satMid: [1500, 1570],
    gpaAvg: 3.93,
    ieltsMin: 7.5,
    toeflMin: 100,
    tuition: 57000,
    tags: ['Ivy League', 'Undergrad focus', 'Generous aid'],
    blurb:
      'Strong undergraduate focus and famously generous financial aid for those who get in.',
  },
  {
    id: 'yale',
    name: 'Yale University',
    country: 'USA',
    location: 'New Haven, CT',
    rank: 5,
    acceptRate: 4.6,
    satMid: [1500, 1560],
    gpaAvg: 3.95,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 62000,
    tags: ['Ivy League', 'Humanities', 'Residential colleges'],
    blurb:
      'Looks for impact within community. Leadership with depth reads stronger than a long thin list.',
  },
  {
    id: 'columbia',
    name: 'Columbia University',
    country: 'USA',
    location: 'New York, NY',
    rank: 6,
    acceptRate: 3.9,
    satMid: [1510, 1570],
    gpaAvg: 3.91,
    ieltsMin: 7.5,
    toeflMin: 100,
    tuition: 65000,
    tags: ['Ivy League', 'Core Curriculum', 'NYC'],
    blurb:
      'The Core Curriculum rewards genuine intellectual breadth, not just a spike.',
  },
  {
    id: 'upenn',
    name: 'University of Pennsylvania',
    country: 'USA',
    location: 'Philadelphia, PA',
    rank: 7,
    acceptRate: 5.8,
    satMid: [1500, 1570],
    gpaAvg: 3.9,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 63000,
    tags: ['Ivy League', 'Wharton', 'Pre-professional'],
    blurb:
      'Pre-professional energy. Wharton applicants are judged on a much steeper curve than the university average.',
  },
  {
    id: 'caltech',
    name: 'California Institute of Technology',
    country: 'USA',
    location: 'Pasadena, CA',
    rank: 8,
    acceptRate: 3.0,
    satMid: [1530, 1580],
    gpaAvg: 3.97,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 60000,
    tags: ['STEM', 'Tiny class', 'Research'],
    blurb:
      'Brutally math/physics-intensive and tiny. Without serious quantitative evidence the odds collapse fast.',
  },
  {
    id: 'uchicago',
    name: 'University of Chicago',
    country: 'USA',
    location: 'Chicago, IL',
    rank: 9,
    acceptRate: 5.4,
    satMid: [1510, 1570],
    gpaAvg: 3.9,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 64000,
    tags: ['Quirky essays', 'Rigor', 'Economics'],
    blurb:
      'Famous for offbeat essays. Intellectual personality on the page matters as much as the numbers.',
  },
  {
    id: 'duke',
    name: 'Duke University',
    country: 'USA',
    location: 'Durham, NC',
    rank: 10,
    acceptRate: 6.0,
    satMid: [1500, 1560],
    gpaAvg: 3.91,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 62000,
    tags: ['Balanced', 'Athletics', 'Research'],
    blurb:
      'Wants the well-lopsided applicant: clear strength plus evidence you contribute to a community.',
  },
  {
    id: 'jhu',
    name: 'Johns Hopkins University',
    country: 'USA',
    location: 'Baltimore, MD',
    rank: 11,
    acceptRate: 7.3,
    satMid: [1520, 1570],
    gpaAvg: 3.92,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 60000,
    tags: ['Pre-med', 'Research', 'BME'],
    blurb:
      'Research powerhouse, especially bio/medicine. Lab or research experience moves the needle here.',
  },
  {
    id: 'northwestern',
    name: 'Northwestern University',
    country: 'USA',
    location: 'Evanston, IL',
    rank: 12,
    acceptRate: 7.2,
    satMid: [1500, 1560],
    gpaAvg: 3.9,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 63000,
    tags: ['Journalism', 'Balanced', 'Quarter system'],
    blurb:
      'Values demonstrated interest and a clear reason this school, not just a high ranking.',
  },
  {
    id: 'cornell',
    name: 'Cornell University',
    country: 'USA',
    location: 'Ithaca, NY',
    rank: 13,
    acceptRate: 7.5,
    satMid: [1470, 1560],
    gpaAvg: 3.9,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 63000,
    tags: ['Ivy League', 'Largest Ivy', 'Specialized colleges'],
    blurb:
      'Admission is by college — fit between your spike and the specific school matters a lot.',
  },
  {
    id: 'berkeley',
    name: 'UC Berkeley',
    country: 'USA',
    location: 'Berkeley, CA',
    rank: 14,
    acceptRate: 11.0,
    satMid: [1330, 1530],
    gpaAvg: 3.89,
    ieltsMin: 6.5,
    toeflMin: 80,
    tuition: 44000,
    tags: ['Public', 'CS/EECS', 'Test-blind'],
    blurb:
      'Top public, but EECS/CS is a different planet of selectivity than the campus average.',
  },
  {
    id: 'ucla',
    name: 'UCLA',
    country: 'USA',
    location: 'Los Angeles, CA',
    rank: 15,
    acceptRate: 8.6,
    satMid: [1290, 1510],
    gpaAvg: 3.9,
    ieltsMin: 7.0,
    toeflMin: 87,
    tuition: 43000,
    tags: ['Public', 'Holistic', 'Test-blind'],
    blurb:
      'Reads applications holistically and reviews context heavily. Story and rigor carry weight.',
  },
  {
    id: 'umich',
    name: 'University of Michigan',
    country: 'USA',
    location: 'Ann Arbor, MI',
    rank: 16,
    acceptRate: 17.0,
    satMid: [1350, 1530],
    gpaAvg: 3.88,
    ieltsMin: 6.5,
    toeflMin: 88,
    tuition: 55000,
    tags: ['Public', 'Engineering', 'Spirit'],
    blurb:
      'A genuine target for strong applicants — selective but reachable with a solid all-round profile.',
  },
  {
    id: 'nyu',
    name: 'New York University',
    country: 'USA',
    location: 'New York, NY',
    rank: 17,
    acceptRate: 9.4,
    satMid: [1450, 1570],
    gpaAvg: 3.8,
    ieltsMin: 7.5,
    toeflMin: 100,
    tuition: 58000,
    tags: ['Urban', 'Arts', 'Global campuses'],
    blurb:
      'Got far more selective recently; aid is limited for international students, so plan finances.',
  },
  {
    id: 'cmu',
    name: 'Carnegie Mellon University',
    country: 'USA',
    location: 'Pittsburgh, PA',
    rank: 18,
    acceptRate: 11.0,
    satMid: [1500, 1560],
    gpaAvg: 3.9,
    ieltsMin: 7.5,
    toeflMin: 100,
    tuition: 61000,
    tags: ['CS', 'Drama', 'By-college admit'],
    blurb:
      'School of Computer Science is one of the hardest admits anywhere; other colleges are more attainable.',
  },
  {
    id: 'gatech',
    name: 'Georgia Tech',
    country: 'USA',
    location: 'Atlanta, GA',
    rank: 19,
    acceptRate: 16.0,
    satMid: [1370, 1530],
    gpaAvg: 3.9,
    ieltsMin: 7.5,
    toeflMin: 90,
    tuition: 32000,
    tags: ['Public', 'Engineering', 'Value'],
    blurb:
      'Engineering value play. Far more open to out-of-state/intl applicants than peer-ranked privates.',
  },
  {
    id: 'oxford',
    name: 'University of Oxford',
    country: 'UK',
    location: 'Oxford, England',
    rank: 1,
    acceptRate: 17.0,
    satMid: [1470, 1560],
    gpaAvg: 3.9,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 45000,
    tags: ['UK', 'Course-specific', 'Interview + test'],
    blurb:
      'Admission is course-specific and academic-only — subject aptitude, admissions test and interview dominate.',
  },
  {
    id: 'cambridge',
    name: 'University of Cambridge',
    country: 'UK',
    location: 'Cambridge, England',
    rank: 2,
    acceptRate: 16.0,
    satMid: [1470, 1560],
    gpaAvg: 3.9,
    ieltsMin: 7.5,
    toeflMin: 110,
    tuition: 46000,
    tags: ['UK', 'Course-specific', 'Supervisions'],
    blurb:
      'Like Oxford: extracurriculars barely count. It is about academic depth in one subject.',
  },
  {
    id: 'imperial',
    name: 'Imperial College London',
    country: 'UK',
    location: 'London, England',
    rank: 3,
    acceptRate: 14.0,
    satMid: [1450, 1550],
    gpaAvg: 3.9,
    ieltsMin: 6.5,
    toeflMin: 92,
    tuition: 40000,
    tags: ['UK', 'STEM-only', 'London'],
    blurb:
      'STEM and medicine specialist. Predicted grades and subject scores are the core of the decision.',
  },
  {
    id: 'toronto',
    name: 'University of Toronto',
    country: 'Canada',
    location: 'Toronto, ON',
    rank: 1,
    acceptRate: 43.0,
    satMid: [1330, 1500],
    gpaAvg: 3.7,
    ieltsMin: 6.5,
    toeflMin: 100,
    tuition: 45000,
    tags: ['Canada', 'Grades-driven', 'Large'],
    blurb:
      'Largely grades-driven. A strong academic record makes this a realistic target rather than a lottery.',
  },
  {
    id: 'asu',
    name: 'Arizona State University',
    country: 'USA',
    location: 'Tempe, AZ',
    rank: 25,
    acceptRate: 88.0,
    satMid: [1130, 1360],
    gpaAvg: 3.5,
    ieltsMin: 6.0,
    toeflMin: 61,
    tuition: 32000,
    tags: ['Safety', 'Large', 'Innovation'],
    blurb:
      'A genuine safety/match for many applicants — accessible, big, and strong in several applied fields.',
  },

  // ---------- International (Europe / Asia / Canada / Australia) ----------
  {
    id: 'eth',
    name: 'ETH Zurich',
    country: 'Switzerland',
    location: 'Zurich, Switzerland',
    rank: 0,
    acceptRate: 27,
    satMid: [1400, 1550],
    gpaAvg: 3.8,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 1600,
    tags: ['STEM', 'Public', 'Very low tuition'],
    blurb:
      'World-class STEM at near-free tuition. Admission is academic and requirements-based — strong math/science prep matters most.',
  },
  {
    id: 'epfl',
    name: 'EPFL',
    country: 'Switzerland',
    location: 'Lausanne, Switzerland',
    rank: 0,
    acceptRate: 30,
    satMid: [1380, 1520],
    gpaAvg: 3.75,
    ieltsMin: 7.0,
    toeflMin: 95,
    tuition: 1600,
    tags: ['STEM', 'Public', 'Research'],
    blurb:
      "Switzerland's engineering and CS powerhouse. Like ETH, it rewards demonstrated technical strength over a polished activity list.",
  },
  {
    id: 'tum',
    name: 'Technical University of Munich',
    country: 'Germany',
    location: 'Munich, Germany',
    rank: 0,
    acceptRate: 12,
    satMid: [1350, 1500],
    gpaAvg: 3.7,
    ieltsMin: 6.5,
    toeflMin: 88,
    tuition: 0,
    tags: ['STEM', 'Public', 'Tuition-free'],
    blurb:
      "Germany's top technical university, tuition-free even for internationals. Decisions hinge on grades and subject fit.",
  },
  {
    id: 'nus',
    name: 'National University of Singapore',
    country: 'Singapore',
    location: 'Singapore',
    rank: 0,
    acceptRate: 9,
    satMid: [1450, 1560],
    gpaAvg: 3.9,
    ieltsMin: 6.5,
    toeflMin: 92,
    tuition: 18000,
    tags: ['Global top 10', 'Research', 'Selective'],
    blurb:
      "Asia's strongest all-rounder and very selective for internationals. High grades and test scores are essential.",
  },
  {
    id: 'ntu',
    name: 'Nanyang Technological University',
    country: 'Singapore',
    location: 'Singapore',
    rank: 0,
    acceptRate: 13,
    satMid: [1400, 1540],
    gpaAvg: 3.85,
    ieltsMin: 6.5,
    toeflMin: 90,
    tuition: 18000,
    tags: ['STEM', 'Research', 'Selective'],
    blurb:
      'Engineering- and tech-focused peer of NUS. Strong, generous scholarships for top international applicants.',
  },
  {
    id: 'hkust',
    name: 'Hong Kong University of Science & Technology',
    country: 'Hong Kong',
    location: 'Hong Kong',
    rank: 0,
    acceptRate: 14,
    satMid: [1400, 1530],
    gpaAvg: 3.8,
    ieltsMin: 6.5,
    toeflMin: 90,
    tuition: 21000,
    tags: ['STEM', 'Business', 'Research'],
    blurb:
      'Young, fast-rising and strong in STEM and business. English-taught and very international.',
  },
  {
    id: 'tsinghua',
    name: 'Tsinghua University',
    country: 'China',
    location: 'Beijing, China',
    rank: 0,
    acceptRate: 3,
    satMid: [1480, 1570],
    gpaAvg: 3.9,
    ieltsMin: 6.5,
    toeflMin: 100,
    tuition: 5000,
    tags: ['Elite', 'STEM', 'Selective'],
    blurb:
      "China's most prestigious university. The English-taught international track is competitive but far cheaper than US peers.",
  },
  {
    id: 'utokyo',
    name: 'University of Tokyo',
    country: 'Japan',
    location: 'Tokyo, Japan',
    rank: 0,
    acceptRate: 30,
    satMid: [1380, 1520],
    gpaAvg: 3.8,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 4500,
    tags: ['Elite', 'Research', 'PEAK program'],
    blurb:
      "Japan's flagship. The English-taught PEAK programs open it to internationals without Japanese fluency.",
  },
  {
    id: 'kaist',
    name: 'KAIST',
    country: 'South Korea',
    location: 'Daejeon, South Korea',
    rank: 0,
    acceptRate: 15,
    satMid: [1400, 1540],
    gpaAvg: 3.8,
    ieltsMin: 6.5,
    toeflMin: 83,
    tuition: 6000,
    tags: ['STEM', 'Research', 'Scholarships'],
    blurb:
      "South Korea's MIT-style science institute, English-taught with strong scholarships for international STEM students.",
  },
  {
    id: 'melbourne',
    name: 'University of Melbourne',
    country: 'Australia',
    location: 'Melbourne, Australia',
    rank: 0,
    acceptRate: 70,
    satMid: [1250, 1450],
    gpaAvg: 3.6,
    ieltsMin: 6.5,
    toeflMin: 79,
    tuition: 33000,
    tags: ['Public', 'Grades-driven', 'Large'],
    blurb:
      "Australia's leading university and largely grades-driven — a realistic target for a solid academic record.",
  },
  {
    id: 'mcgill',
    name: 'McGill University',
    country: 'Canada',
    location: 'Montreal, Canada',
    rank: 0,
    acceptRate: 45,
    satMid: [1300, 1500],
    gpaAvg: 3.7,
    ieltsMin: 6.5,
    toeflMin: 90,
    tuition: 29000,
    tags: ['Canada', 'Grades-driven', 'Global'],
    blurb:
      'Highly international and admits mostly on academics. Strong grades make it a genuine target rather than a lottery.',
  },
  {
    id: 'ubc',
    name: 'University of British Columbia',
    country: 'Canada',
    location: 'Vancouver, Canada',
    rank: 0,
    acceptRate: 52,
    satMid: [1280, 1480],
    gpaAvg: 3.6,
    ieltsMin: 6.5,
    toeflMin: 90,
    tuition: 30000,
    tags: ['Canada', 'Holistic-ish', 'Large'],
    blurb:
      'Top Canadian school that weighs a short personal profile alongside grades. Accessible for strong all-round applicants.',
  },
  {
    id: 'waterloo',
    name: 'University of Waterloo',
    country: 'Canada',
    location: 'Waterloo, Canada',
    rank: 0,
    acceptRate: 53,
    satMid: [1350, 1530],
    gpaAvg: 3.8,
    ieltsMin: 6.5,
    toeflMin: 90,
    tuition: 42000,
    tags: ['CS', 'Co-op', 'Engineering'],
    blurb:
      'Famous for CS, engineering and its co-op program. CS/Software admission is far steeper than the campus average.',
  },
  {
    id: 'lse',
    name: 'London School of Economics',
    country: 'UK',
    location: 'London, England',
    rank: 0,
    acceptRate: 8,
    satMid: [1450, 1550],
    gpaAvg: 3.9,
    ieltsMin: 7.0,
    toeflMin: 100,
    tuition: 32000,
    tags: ['UK', 'Social sciences', 'Course-specific'],
    blurb:
      'The global hub for economics and social sciences. Course-specific and academic-only — grades and subject fit decide it.',
  },
  {
    id: 'ucl',
    name: 'University College London',
    country: 'UK',
    location: 'London, England',
    rank: 0,
    acceptRate: 30,
    satMid: [1380, 1520],
    gpaAvg: 3.8,
    ieltsMin: 6.5,
    toeflMin: 92,
    tuition: 33000,
    tags: ['UK', 'Broad', 'London'],
    blurb:
      'Large, broad and research-intensive in central London. Admission is by course on academic merit.',
  },
  {
    id: 'edinburgh',
    name: 'University of Edinburgh',
    country: 'UK',
    location: 'Edinburgh, Scotland',
    rank: 0,
    acceptRate: 40,
    satMid: [1320, 1500],
    gpaAvg: 3.7,
    ieltsMin: 6.5,
    toeflMin: 92,
    tuition: 30000,
    tags: ['UK', 'Broad', 'Research'],
    blurb:
      'A top, highly international UK university with broad course offerings. Decisions are course-specific and grades-led.',
  },
];

// Curated US schools whose Scorecard name differs from our display name.
const SCORECARD_NAMES = {
  berkeley: 'University of California-Berkeley',
  ucla: 'University of California-Los Angeles',
  umich: 'University of Michigan-Ann Arbor',
  gatech: 'Georgia Institute of Technology-Main Campus',
  asu: 'Arizona State University Campus Immersion',
  columbia: 'Columbia University in the City of New York',
};

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const _generatedByName = new Map(GENERATED_UNIVERSITIES.map((u) => [norm(u.name), u]));

// Curated US entries take their NUMBERS from Scorecard (fresh, official) and
// keep their own id, display name, blurb, tags and hand-checked GPA/English
// minimums. The matching generated row is then dropped as a duplicate.
const _usedGenerated = new Set();
const _curated = CURATED.map((c) => {
  if (c.country !== 'USA') return { ...c, source: c.source || 'Folio curated' };
  const g = _generatedByName.get(norm(SCORECARD_NAMES[c.id] || c.name));
  if (!g) return { ...c, source: c.source || 'Folio curated' };
  _usedGenerated.add(g.id);
  return {
    ...g,
    id: c.id,
    name: c.name,
    blurb: c.blurb,
    tags: [...new Set([...(c.tags || []), ...(g.tags || [])])],
    gpaAvg: c.gpaAvg ?? g.gpaAvg,
    ieltsMin: c.ieltsMin ?? g.ieltsMin,
    toeflMin: c.toeflMin ?? g.toeflMin,
    derived: [],
  };
});

// Folio selectivity rank — our own, transparent index (NOT a copy of any
// commercial ranking): 60% how hard it is to get in (acceptance rate, log
// scale) + 40% how strong the admitted class is (SAT midpoint). Test-blind
// schools without an SAT range are ranked on acceptance rate alone.
function selectivityScore(u) {
  const rate = Math.max(1, u.acceptRate);
  const sel = Math.min(1, Math.log(100 / rate) / Math.log(100 / 3)); // 3% → 1, 100% → 0
  if (!u.satMid) return sel;
  const mid = (u.satMid[0] + u.satMid[1]) / 2;
  const sat = Math.max(0, Math.min(1, (mid - 1000) / 560)); // 1000 → 0, 1560 → 1
  return sel * 0.6 + sat * 0.4;
}

const _merged = [..._curated, ...GENERATED_UNIVERSITIES.filter((u) => !_usedGenerated.has(u.id) && !CURATED.some((c) => c.id === u.id))]
  .map((u) => ({ ...u, selectivity: Math.round(selectivityScore(u) * 1000) / 10 }))
  .sort((a, b) => b.selectivity - a.selectivity || a.acceptRate - b.acceptRate);

_merged.forEach((u, i) => {
  u.rank = i + 1;
});

export const UNIVERSITIES = _merged;

// Rank tiers for filters and badges.
export const RANK_TIERS = [
  { id: 'top20', max: 20, label: 'Top 20' },
  { id: 'top50', max: 50, label: 'Top 50' },
  { id: 'top100', max: 100, label: 'Top 100' },
  { id: 'top200', max: 200, label: 'Top 200' },
];

export function rankTier(rank) {
  return RANK_TIERS.find((t) => rank <= t.max) || null;
}

export function getUniversity(id) {
  return UNIVERSITIES.find((u) => u.id === id);
}
