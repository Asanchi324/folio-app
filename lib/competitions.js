// Database of competitions, olympiads, research programs and summer programs
// applicants can join to strengthen a portfolio. The AI recommender pulls from
// this list, and students can browse it directly for ideas.
//
// level: international | national | regional | online
// type:  olympiad | competition | research | program | scholarship
// cost:  free | paid | stipend  (stipend = they pay you)

import { GENERATED_COMPETITIONS } from '@/lib/competitions.generated';

const CORE = [
  // ---------- STEM olympiads ----------
  {
    id: 'imo',
    name: 'International Mathematical Olympiad (IMO)',
    category: 'Math',
    type: 'olympiad',
    level: 'international',
    subject: 'Mathematics',
    cost: 'free',
    difficulty: 5,
    selectivity: 'Top ~6 per country',
    season: 'Jul (nat. rounds winter–spring)',
    blurb:
      'The most prestigious pre-college math contest. Even a national-round result is a serious signal.',
    link: 'https://www.imo-official.org',
  },
  {
    id: 'ipho',
    name: 'International Physics Olympiad (IPhO)',
    category: 'Science',
    type: 'olympiad',
    level: 'international',
    subject: 'Physics',
    cost: 'free',
    difficulty: 5,
    selectivity: 'National team only',
    season: 'Jul',
    blurb:
      'Elite physics olympiad. National-level qualification already reads as exceptional for STEM admits.',
    link: 'https://www.ipho-unofficial.org',
  },
  {
    id: 'ioi',
    name: 'International Olympiad in Informatics (IOI)',
    category: 'Computer Science',
    type: 'olympiad',
    level: 'international',
    subject: 'Programming / Algorithms',
    cost: 'free',
    difficulty: 5,
    selectivity: 'National team only',
    season: 'Aug',
    blurb:
      'Premier competitive-programming olympiad. Gold-standard evidence of algorithmic ability for CS.',
    link: 'https://ioinformatics.org',
  },
  {
    id: 'usaco',
    name: 'USACO (USA Computing Olympiad)',
    category: 'Computer Science',
    type: 'competition',
    level: 'online',
    subject: 'Competitive Programming',
    cost: 'free',
    difficulty: 4,
    selectivity: 'Open; promotes by division',
    season: 'Dec–Mar (4 online contests)',
    blurb:
      'Open to anyone worldwide and fully online. Reaching Gold/Platinum is a concrete, verifiable CS spike.',
    link: 'https://usaco.org',
  },
  {
    id: 'ibo',
    name: 'International Biology Olympiad (IBO)',
    category: 'Science',
    type: 'olympiad',
    level: 'international',
    subject: 'Biology',
    cost: 'free',
    difficulty: 5,
    selectivity: 'National team only',
    season: 'Jul',
    blurb:
      'Strong signal for pre-med and life-sciences applicants. Start from your national biology olympiad.',
    link: 'https://www.ibo-info.org',
  },
  {
    id: 'icho',
    name: 'International Chemistry Olympiad (IChO)',
    category: 'Science',
    type: 'olympiad',
    level: 'international',
    subject: 'Chemistry',
    cost: 'free',
    difficulty: 5,
    selectivity: 'National team only',
    season: 'Jul',
    blurb:
      'Theory + lab chemistry at the highest level. National qualification is a major differentiator.',
    link: 'https://www.ichosc.org',
  },

  // ---------- Research / science fairs ----------
  {
    id: 'isef',
    name: 'Regeneron ISEF',
    category: 'Research',
    type: 'research',
    level: 'international',
    subject: 'Any STEM research',
    cost: 'free',
    difficulty: 5,
    selectivity: 'Via affiliated fairs',
    season: 'May (qualify via local fairs)',
    blurb:
      'The world’s largest pre-college science fair. A finalist project is one of the strongest STEM credentials available.',
    link: 'https://www.societyforscience.org/isef',
  },
  {
    id: 'rsi',
    name: 'Research Science Institute (RSI)',
    category: 'Research',
    type: 'program',
    level: 'international',
    subject: 'STEM research (summer)',
    cost: 'free',
    difficulty: 5,
    selectivity: '~3% acceptance',
    season: 'Summer (apply Dec–Jan)',
    blurb:
      'Free, ultra-selective summer research program at MIT. One of the most respected lines on any STEM application.',
    link: 'https://www.cee.org/programs/research-science-institute',
  },
  {
    id: 'pioneer',
    name: 'Pioneer Research Program',
    category: 'Research',
    type: 'research',
    level: 'international',
    subject: 'Mentored research (any field)',
    cost: 'paid',
    difficulty: 4,
    selectivity: 'Selective',
    season: 'Year-round cohorts',
    blurb:
      'Online 1-on-1 research with a university professor, ending in a paper. Open to most fields, including humanities.',
    link: 'https://pioneeracademics.com',
  },

  // ---------- Business / entrepreneurship / econ ----------
  {
    id: 'diamond-challenge',
    name: 'Diamond Challenge',
    category: 'Business',
    type: 'competition',
    level: 'international',
    subject: 'Entrepreneurship',
    cost: 'free',
    difficulty: 3,
    selectivity: 'Open, team-based',
    season: 'Submit by Jan',
    blurb:
      'Global high-school entrepreneurship competition. Great for turning a club or side project into a credential.',
    link: 'https://diamondchallenge.org',
  },
  {
    id: ' international-econ-olympiad',
    name: 'International Economics Olympiad (IEO)',
    category: 'Business',
    type: 'olympiad',
    level: 'international',
    subject: 'Economics / Finance',
    cost: 'free',
    difficulty: 4,
    selectivity: 'National team only',
    season: 'Summer',
    blurb:
      'Economics, finance and business-case rounds. Ideal spike for prospective economics/business majors.',
    link: 'https://ecolymp.org',
  },
  {
    id: 'wharton-investment',
    name: 'Wharton Global High School Investment Competition',
    category: 'Business',
    type: 'competition',
    level: 'international',
    subject: 'Investing / Finance',
    cost: 'free',
    difficulty: 3,
    selectivity: 'Open, team-based',
    season: 'Sep–Feb',
    blurb:
      'Run by UPenn’s Wharton School. Teams manage a virtual portfolio and pitch a strategy — strong for finance interest.',
    link: 'https://globalyouth.wharton.upenn.edu',
  },

  // ---------- Writing / humanities ----------
  {
    id: 'scholastic',
    name: 'Scholastic Art & Writing Awards',
    category: 'Writing & Arts',
    type: 'competition',
    level: 'national',
    subject: 'Writing / Visual Art',
    cost: 'paid',
    difficulty: 3,
    selectivity: 'Regional → national medals',
    season: 'Submit fall–winter',
    blurb:
      'The most recognised US creative award for teens. A National Medal is meaningful for humanities/arts applicants.',
    link: 'https://www.artandwriting.org',
  },
  {
    id: 'jfk-essay',
    name: 'JFK Profile in Courage Essay Contest',
    category: 'Writing & Arts',
    type: 'competition',
    level: 'national',
    subject: 'Essay / Political Science',
    cost: 'free',
    difficulty: 3,
    selectivity: 'Open',
    season: 'Submit by Jan',
    blurb:
      'National essay contest with cash prizes. Good for demonstrating writing and civic/political interest.',
    link: 'https://www.jfklibrary.org/learn/education/profile-in-courage-essay-contest',
  },
  {
    id: 'john-locke',
    name: 'John Locke Institute Essay Competition',
    category: 'Writing & Arts',
    type: 'competition',
    level: 'international',
    subject: 'Philosophy / Economics / History',
    cost: 'free',
    difficulty: 4,
    selectivity: 'Highly competitive',
    season: 'Submit by Jun',
    blurb:
      'Rigorous open-ended essays judged by Oxford-affiliated academics. Highly regarded for humanities/social-science applicants.',
    link: 'https://www.johnlockeinstitute.com/essay-competition',
  },

  // ---------- Leadership / service / debate ----------
  {
    id: 'debate-wsdc',
    name: 'World Schools Debating Championships',
    category: 'Leadership',
    type: 'competition',
    level: 'international',
    subject: 'Debate / Public Speaking',
    cost: 'free',
    difficulty: 4,
    selectivity: 'National team only',
    season: 'Summer',
    blurb:
      'Top-tier debate. Even strong national-circuit results demonstrate argument, research and leadership.',
    link: 'https://worldschoolsdebating.org',
  },
  {
    id: 'mun',
    name: 'Model United Nations (e.g. HMUN, THIMUN)',
    category: 'Leadership',
    type: 'competition',
    level: 'international',
    subject: 'Diplomacy / Policy',
    cost: 'paid',
    difficulty: 2,
    selectivity: 'Open conferences',
    season: 'Year-round',
    blurb:
      'Accessible entry point for leadership and global affairs. Awards at flagship conferences (HMUN) carry weight.',
    link: 'https://www.wfuna.org',
  },
  {
    id: 'founder-project',
    name: 'Launch your own initiative / nonprofit',
    category: 'Leadership',
    type: 'program',
    level: 'regional',
    subject: 'Self-directed impact',
    cost: 'free',
    difficulty: 3,
    selectivity: 'Self-started',
    season: 'Anytime',
    blurb:
      'Not a contest — a self-started project solving a real problem in your community. Measurable impact often beats a generic award.',
    link: '',
  },

  // ---------- Scholarships / accessible programs ----------
  {
    id: 'coca-cola',
    name: 'Coca-Cola Scholars Program',
    category: 'Scholarship',
    type: 'scholarship',
    level: 'national',
    subject: 'Leadership / All-round',
    cost: 'stipend',
    difficulty: 4,
    selectivity: '~150 of 90k+',
    season: 'Apply by Oct (US seniors)',
    blurb:
      'Prestigious US leadership scholarship ($20k). Recognition itself is a strong line, beyond the money.',
    link: 'https://www.coca-colascholarsfoundation.org',
  },
  {
    id: 'yygs',
    name: 'Yale Young Global Scholars (YYGS)',
    category: 'Summer Program',
    type: 'program',
    level: 'international',
    subject: 'Interdisciplinary',
    cost: 'paid',
    difficulty: 3,
    selectivity: 'Selective; need-based aid',
    season: 'Summer (apply by Jan)',
    blurb:
      'Two-week academic summer program at Yale with strong financial aid. Good for exploring interests and intl exposure.',
    link: 'https://globalscholars.yale.edu',
  },

  // ---------- More accessible / varied ideas ----------
  {
    id: 'firc',
    name: 'FIRST Robotics Competition',
    category: 'Computer Science',
    type: 'competition',
    level: 'international',
    subject: 'Robotics / Engineering',
    cost: 'paid',
    difficulty: 3,
    selectivity: 'Team-based, open',
    season: 'Build Jan–Mar, events spring',
    blurb:
      'Teams build a competition robot in six weeks. Tangible engineering + leadership signal, and a feeder for awards and scholarships.',
    link: 'https://www.firstinspires.org/robotics/frc',
  },
  {
    id: 'hackathons',
    name: 'Hackathons (MLH-affiliated)',
    category: 'Computer Science',
    type: 'competition',
    level: 'online',
    subject: 'Software / Building',
    cost: 'free',
    difficulty: 2,
    selectivity: 'Open',
    season: 'Year-round',
    blurb:
      'Build a working project in 24–48 hours, solo or in a team. Low barrier, fully remote, and a great source of portfolio projects.',
    link: 'https://mlh.io',
  },
  {
    id: 'iol',
    name: 'International Linguistics Olympiad (IOL)',
    category: 'Science',
    type: 'olympiad',
    level: 'international',
    subject: 'Linguistics / Logic',
    cost: 'free',
    difficulty: 4,
    selectivity: 'National team only',
    season: 'Summer',
    blurb:
      'Logic puzzles over real languages — no prior linguistics needed. A distinctive spike for CS, languages and cognitive science.',
    link: 'https://iolingmarking.org',
  },
  {
    id: 'breakthrough-junior',
    name: 'Breakthrough Junior Challenge',
    category: 'Science',
    type: 'competition',
    level: 'international',
    subject: 'Science communication',
    cost: 'free',
    difficulty: 3,
    selectivity: 'Open; global judging',
    season: 'Submit by ~Jun',
    blurb:
      'Explain a tough science concept in a short video. Accessible worldwide, with a large scholarship and real prestige.',
    link: 'https://breakthroughjuniorchallenge.org',
  },
  {
    id: 'conrad',
    name: 'Conrad Challenge',
    category: 'Business',
    type: 'competition',
    level: 'international',
    subject: 'Innovation / Entrepreneurship',
    cost: 'free',
    difficulty: 3,
    selectivity: 'Team-based, open',
    season: 'Fall–spring',
    blurb:
      'Teams design a product or venture tackling a real-world problem. A good bridge between STEM and entrepreneurship.',
    link: 'https://www.conradchallenge.org',
  },
  {
    id: 'deca-fbla',
    name: 'DECA / FBLA (business clubs)',
    category: 'Business',
    type: 'competition',
    level: 'international',
    subject: 'Business / Marketing / Finance',
    cost: 'paid',
    difficulty: 3,
    selectivity: 'Advances by event',
    season: 'Regionals winter → internationals spring',
    blurb:
      'Case and role-play business competitions with a clear regional→state→international ladder. Accessible and well-recognised for business majors.',
    link: 'https://www.deca.org',
  },
  {
    id: 'national-history-day',
    name: 'National History Day',
    category: 'Writing & Arts',
    type: 'competition',
    level: 'national',
    subject: 'History / Research',
    cost: 'paid',
    difficulty: 3,
    selectivity: 'School → national',
    season: 'Contests spring',
    blurb:
      'Year-long historical research presented as a paper, exhibit, documentary or performance. A strong humanities research credential.',
    link: 'https://www.nhd.org',
  },
  {
    id: 'genius-olympiad',
    name: 'GENIUS Olympiad',
    category: 'Science',
    type: 'competition',
    level: 'international',
    subject: 'Environmental projects (STEM/arts/writing)',
    cost: 'paid',
    difficulty: 3,
    selectivity: 'Via project review',
    season: 'Submit winter, finals Jun',
    blurb:
      'Environment-themed projects across science, art, writing and design. A broad entry point for an issue-driven applicant.',
    link: 'https://www.geniusolympiad.org',
  },
];

// Core (hand-written) + extended catalog, de-duplicated by id.
const _ids = new Set(CORE.map((c) => c.id));
export const COMPETITIONS = [
  ...CORE,
  ...GENERATED_COMPETITIONS.filter((c) => !_ids.has(c.id)),
];

export const CATEGORIES = [
  'All',
  'Math',
  'Science',
  'Computer Science',
  'Research',
  'Business',
  'Writing & Arts',
  'Leadership',
  'Scholarship',
  'Summer Program',
];

// Map an intended major (free text) to the catalog categories most worth
// surfacing for that student.
const MAJOR_CATEGORY_HINTS = [
  [/comput|software|\bcs\b|data|\bai\b|machine|program/i, ['Computer Science', 'Math']],
  [/math/i, ['Math', 'Computer Science']],
  [/physic|astro|engineer|mechan|electr/i, ['Science', 'Math']],
  [/bio|medic|health|pre-?med|neuro|chem|life scien/i, ['Science', 'Research']],
  [/econ|business|finance|account|management|entrepreneur|market/i, ['Business']],
  [/law|polit|histor|philos|writ|english|literat|journal|humanit|social/i, ['Writing & Arts', 'Leadership']],
  [/art|design|film|music|theat|architect/i, ['Writing & Arts']],
];

function relevantCategories(intendedMajor = '') {
  for (const [re, cats] of MAJOR_CATEGORY_HINTS) {
    if (re.test(intendedMajor)) return cats;
  }
  return [];
}

// Pick a small, relevant slice of the catalog instead of dumping all of it.
// This is what keeps the AI feedback prompt bounded even as the catalog grows:
// rank by major-fit + general usefulness, keep category variety, cap at `limit`.
// Deterministic (stable sort, no randomness).
export function selectCompetitions(portfolio = {}, limit = 16) {
  const wanted = relevantCategories(portfolio.intendedMajor || '');
  const scored = COMPETITIONS.map((c) => {
    let s = 0;
    if (wanted.includes(c.category)) s += 5; // matches their intended field
    if (c.category === 'Research') s += 2; // research strengthens almost any profile
    if (c.category === 'Leadership') s += 1;
    if (c.cost !== 'paid') s += 1; // nudge toward accessible (free/stipend) options
    return { c, s };
  }).sort((a, b) => b.s - a.s);

  const perCatCap = Math.max(3, Math.ceil(limit / 3));
  const out = [];
  const seen = {};
  for (const { c } of scored) {
    const n = seen[c.category] || 0;
    if (n >= perCatCap) continue; // keep variety so it isn't all one bucket
    out.push(c);
    seen[c.category] = n + 1;
    if (out.length >= limit) break;
  }
  return out;
}
