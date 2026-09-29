// The exact slice of a portfolio the AI review is allowed to see.
//
// Why this exists: the review used to be prompted with the whole portfolio
// object — which carries `savedFeedback`, i.e. the PREVIOUS review. The model
// read its own old advice (naming activities the student had since deleted) and
// echoed it back, so a refreshed review kept describing a portfolio that no
// longer existed. This module is the single definition of "what's in the
// portfolio right now": the client sends it, fingerprints it, and the server
// prompts from it. Nothing else — no prior review, no deadlines, no share
// settings — reaches the model.
//
// It also drops blank rows and empty fields, so an untouched "+ Add activity"
// row can't be read as a real activity.

// Every field is length-capped: the snapshot is what the server prompts from,
// so this also bounds prompt size (cost) no matter what a client posts.
function str(v, max = 600) {
  if (v === 0) return '0';
  if (v === null || v === undefined) return '';
  return String(v).trim().slice(0, max);
}

// Keep only keys with real content — an empty string in the prompt invites the
// model to guess at what used to be there.
function compact(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export function reviewSnapshot(p) {
  const P = p && typeof p === 'object' ? p : {};
  const a = P.academics || {};
  const t = P.testing || {};
  const n = P.narrative || {};

  const apScores = (Array.isArray(t.apScores) ? t.apScores.slice(0, 15) : [])
    .map((x) => compact({ subject: str(x?.subject), score: str(x?.score) }))
    .filter((x) => x.subject || x.score);

  const activities = (Array.isArray(P.activities) ? P.activities.slice(0, 10) : [])
    .map((x) =>
      compact({
        position: str(x?.position),
        organization: str(x?.organization),
        description: str(x?.description, 1200),
        years: str(x?.years),
        hoursPerWeek: str(x?.hours),
      })
    )
    .filter((x) => x.position || x.organization || x.description);

  const honors = (Array.isArray(P.honors) ? P.honors.slice(0, 5) : [])
    .map((x) => compact({ title: str(x?.title), level: str(x?.level), grade: str(x?.grade) }))
    .filter((x) => x.title);

  return {
    gradeLevel: str(P.gradeLevel),
    country: str(P.country),
    targetCountries: (Array.isArray(P.targetCountries) ? P.targetCountries : [])
      .map(str)
      .filter(Boolean),
    intendedMajor: str(P.intendedMajor),
    academics: compact({
      gpa: str(a.gpa),
      gpaScale: str(a.gpaScale),
      classRank: str(a.classRank),
      rigor: str(a.rigor),
    }),
    testing: compact({
      sat: str(t.sat),
      act: str(t.act),
      ielts: str(t.ielts),
      toefl: str(t.toefl),
      apScores,
    }),
    activities,
    honors,
    narrative: compact({ spike: str(n.spike), personalStatement: str(n.personalStatement, 9000) }),
  };
}

// Fingerprint of that snapshot. Because it hashes exactly what the model sees,
// a saved review is flagged stale for every change that could alter it — and
// only for those.
export function reviewSignature(p) {
  const str_ = JSON.stringify(reviewSnapshot(p));
  let h = 5381;
  for (let i = 0; i < str_.length; i++) h = ((h << 5) + h + str_.charCodeAt(i)) | 0;
  return h.toString(36);
}
