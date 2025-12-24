import { useState } from "react";
import type { Activity, EvaluationResult, ProfileInputs } from "../types";
import { evaluateProfileWithChatGPT } from "../ai/chatgpt";
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
      // Try ChatGPT first, fallback to mock if no API key
      const res = await evaluateProfileWithChatGPT(inputs, activities);
      setResult(res);
    } catch (error) {
      console.error("AI evaluation error:", error);
      // Fallback to mock evaluation
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
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-bold tracking-tight text-ink">
          🎓 AI Admissions Evaluation
        </h2>
        <p className="text-sm text-ink-soft mt-1">
          Powered by ChatGPT. Get a realistic assessment of your profile and actionable next steps.
        </p>
      </header>
      <form
        className="space-y-3 rounded-2xl border-2 border-accent/20 bg-gradient-to-br from-white to-accent-soft/30 p-4 shadow-subtle-lg"
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
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-accent to-accent-dark px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "🤖 Analyzing your profile..." : "🚀 Get AI Evaluation"}
          </button>
        </div>
        <p className="text-[10px] text-ink-soft">
          This is an informal, AI‑assisted estimate to help with planning. It
          does not replace real advising or official policies.
        </p>
      </form>

      {result && (
        <div className="fade-in space-y-4 rounded-2xl border-2 border-accent/30 bg-white p-5 shadow-subtle-lg">
          <div className="flex items-start justify-between gap-4 pb-3 border-b-2 border-accent/10">
            <div className="flex-1">
              <div className="text-xs font-semibold text-ink-soft mb-1">
                Competitiveness Assessment
              </div>
              <div className={`text-2xl font-bold ${
                result.level === "Reach" ? "text-accent-dark" :
                result.level === "Match" ? "text-blue-600" :
                result.level === "Safety" ? "text-success" :
                "text-ink-soft"
              }`}>
                {result.level === "Unclear"
                  ? "Needs More Information"
                  : `${result.level} Candidate`}
              </div>
            </div>
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-dark whitespace-nowrap">
              AI Guide
            </span>
          </div>
          <p className="text-sm text-ink leading-relaxed bg-accent-soft/20 p-3 rounded-lg">{result.summary}</p>
          
          {result.strengths.length > 0 && (
            <div className="bg-green-50 border-l-4 border-success p-3 rounded-r-lg">
              <div className="text-sm font-bold text-success mb-2 flex items-center gap-2">
                ✅ Strengths
              </div>
              <ul className="space-y-1.5">
                {result.strengths.map((s) => (
                  <li key={s} className="text-sm text-ink-soft flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {result.weaknesses.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-warning p-3 rounded-r-lg">
              <div className="text-sm font-bold text-warning mb-2 flex items-center gap-2">
                ⚠️ Areas to Improve
              </div>
              <ul className="space-y-1.5">
                {result.weaknesses.map((w) => (
                  <li key={w} className="text-sm text-ink-soft flex items-start gap-2">
                    <span className="text-warning mt-0.5">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {result.suggestions.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-accent p-3 rounded-r-lg">
              <div className="text-sm font-bold text-accent mb-2 flex items-center gap-2">
                🎯 Action Steps
              </div>
              <ul className="space-y-1.5">
                {result.suggestions.map((s) => (
                  <li key={s} className="text-sm text-ink flex items-start gap-2">
                    <span className="text-accent mt-0.5">→</span>
                    <span className="font-medium">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}


