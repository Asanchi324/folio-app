// Essay hooks — what the first lines of real admitted essays do.
//
// Built from 76 essays that admissions offices published themselves (Johns
// Hopkins, Connecticut College, Hamilton, Tufts), each opening hand-labelled
// into one of eight hook types (data/essay-hooks.json). Used two ways:
//   • hookPromptBlock(): the taxonomy, with real shares and one example move
//     per type, for the AI essay coach;
//   • analyzeHook(text): a deterministic first-line check (clichés, concrete
//     detail, length) that anchors the model's hook score.

import data from '@/data/essay-hooks.json';

// Marks strings for the translation extractor.
const msg = (s) => s;

export const HOOKS = data.taxonomy;
export const HOOK_SAMPLE = data.sample.essays;

export const HOOK_LABEL = {
  scene: msg('Scene, mid-action'),
  bold_claim: msg('Bold or paradoxical claim'),
  dialogue: msg('Line of dialogue'),
  format: msg('Unconventional format'),
  concept: msg('Idea as a lens'),
  question: msg('Question to the reader'),
  setting_detail: msg('Precise setting or irony'),
  reflective: msg('Reflective opening'),
};

const HOOK_IDS = HOOKS.map((h) => h.id);

// Openings readers have seen thousands of times.
const CLICHE_RE = /^(ever since|since i was (little|young|a child|\d+)|for as long as i can remember|i have always|i've always|my (whole )?life|growing up|throughout my life|from a young age|from an early age|my lifelong dream|webster|the dictionary defines|according to (the )?(merriam|oxford)|in today's (world|society)|have you ever (wondered|thought)|с самого детства|с детства|сколько себя помню|всю (свою )?жизнь|я всегда|с ранних лет|с малых лет|бала кезімнен|есімді білгеннен|өмір бойы|мен әрқашан)/i;
const ACHIEVEMENT_RE = /^(as (the )?(president|captain|founder|leader|head)|i (won|was awarded|received|achieved)|being (the )?(president|captain|founder)|будучи (президентом|капитаном|основателем)|я (выиграл|победил|занял|получил награду))/i;
const QUOTE_START_RE = /^[«"“„']/;

function firstSentences(text, n = 2) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const parts = clean.match(/[^.!?…]+[.!?…]+["»”']?|[^.!?…]+$/g) || [];
  return parts.slice(0, n).map((s) => s.trim());
}

// Cheap, explainable signals about the opening. Not a verdict — an anchor.
export function analyzeHook(text) {
  const [s1 = '', s2 = ''] = firstSentences(text, 2);
  const words = s1.split(/\s+/).filter(Boolean).length;
  const opening = `${s1} ${s2}`;
  const signals = {
    cliche: CLICHE_RE.test(s1),
    achievement: ACHIEVEMENT_RE.test(s1),
    dialogue: QUOTE_START_RE.test(s1),
    question: /\?\s*["»”']?$/.test(s1),
    // A number or a capitalised word that isn't the first word — places,
    // names, brands: the "concrete noun" strong openings almost always have.
    concrete: /\d/.test(opening) || /\s[A-ZА-ЯЁӘҒҚҢӨҰҮҺІ][a-zа-яёәғқңөұүһі]{2,}/.test(opening),
    words,
  };
  let guess = 'scene';
  if (signals.cliche) guess = 'reflective';
  else if (signals.dialogue) guess = 'dialogue';
  else if (signals.question) guess = 'question';
  else if (words <= 9) guess = 'bold_claim';
  // Ceiling the model's hook score can't exceed.
  let cap = 10;
  if (signals.cliche) cap = 4;
  else if (signals.achievement) cap = 5;
  else if (words > 45) cap = 6;
  return { guess, signals, cap };
}

export function normalizeHookType(id) {
  return HOOK_IDS.includes(id) ? id : null;
}

export function hookPromptBlock() {
  const lines = HOOKS.map((h) => {
    const ex = h.examples[0];
    return `- ${h.id} (${h.share}% of admitted essays): ${h.what} WHY: ${h.why} FAILS WHEN: ${h.risk} TEST: ${h.test}${ex ? ` EXAMPLE (${ex.school}, "${ex.title}"): ${ex.move}` : ''}`;
  });
  return `HOOK TAXONOMY — from ${HOOK_SAMPLE} essays that admissions offices published as "essays that worked":
${lines.join('\n')}
FINDINGS:
${data.findings.map((f) => `- ${f}`).join('\n')}`;
}
