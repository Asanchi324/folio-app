import { useState } from "react";
import type { Activity, EvaluationResult, ProfileInputs } from "../types";
import { evaluateProfile } from "../ai/mockAi";

interface Props {
  activities: Activity[];
}

const initialInputs: ProfileInputs = {
  gpa: "",
  sat: "",
  ielts: "",
  toefl: "",
  intendedMajor: "",
  targetUniversities: ""
};

export function AdmissionsAI({ activities }: Props) {
  const [inputs, setInputs] = useState<ProfileInputs>(initialInputs);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ProfileInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await evaluateProfile(inputs, activities);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInputs(initialInputs);
    setResult(null);
  };

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-sm font-semibold tracking-tight">
          AI admissions view
        </h2>
        <p className="text-xs text-ink-soft">
          Get a rough sense of where you stand and what to improve. This is a
          planning tool, not an official decision.
        </p>
      </header>
      <form
        className="space-y-2 rounded-xl border border-border bg-surface-elevated p-3 text-xs shadow-subtle"
        onSubmit={handleEvaluate}
      >
        <div className="grid gap-2 grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-soft">GPA (unweighted)</span>
            <input
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="e.g. 3.7"
              value={inputs.gpa}
              onChange={(e) => handleChange("gpa", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-soft">SAT (optional)</span>
            <input
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="e.g. 1450"
              value={inputs.sat}
              onChange={(e) => handleChange("sat", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-soft">
              IELTS overall (optional)
            </span>
            <input
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="e.g. 7.5"
              value={inputs.ielts}
              onChange={(e) => handleChange("ielts", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-soft">
              TOEFL iBT (optional)
            </span>
            <input
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="e.g. 100"
              value={inputs.toefl}
              onChange={(e) => handleChange("toefl", e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">Intended major</span>
          <input
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Computer science, economics, psychology…"
            value={inputs.intendedMajor}
            onChange={(e) => handleChange("intendedMajor", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">
            Target universities (comma‑separated)
          </span>
          <textarea
            className="min-h-[60px] rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="e.g. University of Toronto, UCL, NYU, local options…"
            value={inputs.targetUniversities}
            onChange={(e) =>
              handleChange("targetUniversities", e.target.value)
            }
          />
        </label>
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-border px-3 py-1 text-[11px] text-ink-soft hover:bg-surface"
          >
            Clear
          </button>
          <button
            type="submit"
            className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
          >
            {loading ? "Thinking…" : "Estimate chances & next steps"}
          </button>
        </div>
        <p className="text-[10px] text-ink-soft">
          This is an informal, AI‑assisted estimate to help with planning. It
          does not replace real advising or official policies.
        </p>
      </form>

      {result && (
        <div className="fade-in space-y-2 rounded-xl border border-border bg-surface-elevated p-3 text-xs shadow-subtle">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-ink-soft">
                Competitiveness snapshot
              </div>
              <div className="text-sm font-semibold">
                {result.level === "Unclear"
                  ? "Needs more information"
                  : `${result.level} profile for many targets`}
              </div>
            </div>
            <span className="rounded-full bg-surface px-2 py-1 text-[11px] text-ink-soft">
              Guide, not a verdict
            </span>
          </div>
          <p className="text-[11px] text-ink-soft">{result.summary}</p>
          {result.strengths.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-ink">
                Strengths
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-ink-soft">
                {result.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {result.weaknesses.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-ink">
                Gaps & risks
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-ink-soft">
                {result.weaknesses.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {result.suggestions.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-ink">
                Specific next moves
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-ink-soft">
                {result.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}


