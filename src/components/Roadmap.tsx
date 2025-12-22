import type { GradeLevel, RoadmapStage, TargetRegion } from "../types";
import { useMemo } from "react";

interface Props {
  gradeLevel: GradeLevel;
  region: TargetRegion;
  stages: RoadmapStage[];
  onChange: (stages: RoadmapStage[]) => void;
}

export function Roadmap({ gradeLevel, region, stages, onChange }: Props) {
  const configuredStages = useMemo(
    () => ensureDefaultsForContext(stages, gradeLevel, region),
    [stages, gradeLevel, region]
  );

  const toggleItem = (stageId: string, itemId: string) => {
    const next = configuredStages.map((stage) =>
      stage.id !== stageId
        ? stage
        : {
            ...stage,
            checklist: stage.checklist.map((item) =>
              item.id === itemId ? { ...item, done: !item.done } : item
            )
          }
    );
    onChange(next);
  };

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-sm font-semibold tracking-tight">
          Admissions roadmap
        </h2>
        <p className="text-xs text-ink-soft">
          See your application journey from now to submission. Check items off
          as you go; the roadmap adjusts to your grade and target region.
        </p>
      </header>
      <div className="space-y-2 text-[11px]">
        {configuredStages.map((stage) => {
          const completed = stage.checklist.filter((c) => c.done).length;
          const total = stage.checklist.length || 1;
          const pct = Math.round((completed / total) * 100);

          return (
            <article
              key={stage.id}
              className="rounded-xl border border-border bg-surface-elevated p-3 shadow-subtle"
            >
              <header className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium">{stage.title}</div>
                  <p className="text-[11px] text-ink-soft">
                    {stage.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-ink-soft">
                    {pct}% complete
                  </div>
                  <div className="mt-1 h-1.5 w-20 rounded-full bg-surface">
                    <div
                      className="h-1.5 rounded-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </header>
              <ul className="mt-2 space-y-1">
                {stage.checklist.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggleItem(stage.id, item.id)}
                      className={`mt-[2px] h-3.5 w-3.5 rounded border text-[10px] flex items-center justify-center ${
                        item.done
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-surface text-transparent"
                      }`}
                    >
                      ✓
                    </button>
                    <span
                      className={`text-[11px] ${
                        item.done
                          ? "text-ink-soft line-through"
                          : "text-ink"
                      }`}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              <footer className="mt-2 rounded-lg bg-surface px-2 py-1.5 text-[11px] text-ink-soft">
                <span className="font-medium text-ink">What to do next: </span>
                {stage.suggestedNextStep}
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ensureDefaultsForContext(
  stages: RoadmapStage[],
  gradeLevel: GradeLevel,
  region: TargetRegion
): RoadmapStage[] {
  if (stages.length > 0) return stages;

  const earlyTesting =
    gradeLevel === "11" || gradeLevel === "12" || gradeLevel === "Gap";

  const wantsEnglishTest =
    region === "USA" ||
    region === "UK" ||
    region === "Europe" ||
    region === "Canada";

  const base: RoadmapStage[] = [
    {
      id: "tests",
      title: "Standardized tests",
      description: earlyTesting
        ? "Lock in your scores early so you can focus on essays and applications."
        : "Map out when you’ll take key exams—no need to rush, just be intentional.",
      checklist: [
        {
          id: "plan-sat",
          label: "Choose your SAT / ACT target window",
          done: false
        },
        {
          id: "diagnostic",
          label: "Take a diagnostic SAT or ACT to see your baseline",
          done: false
        },
        ...(wantsEnglishTest
          ? [
              {
                id: "english-test",
                label:
                  "Decide on IELTS / TOEFL / Duolingo English Test (if needed)",
                done: false
              }
            ]
          : [])
      ],
      suggestedNextStep: earlyTesting
        ? "Pick your final SAT/ACT date and block out weekly practice sessions on your calendar."
        : "Take one diagnostic test and use the result to decide whether standardized testing will be a strength or simply ‘good enough’."
    },
    {
      id: "extracurriculars",
      title: "Extracurricular development",
      description:
        "Deepen 2–3 activities instead of spreading yourself across many disconnected ones.",
      checklist: [
        {
          id: "pick-core",
          label:
            "Choose 2–3 core activities you are willing to commit to long‑term",
          done: false
        },
        {
          id: "leadership-plan",
          label:
            "Identify one realistic way to add leadership or responsibility in an existing activity",
          done: false
        },
        {
          id: "impact-metric",
          label:
            "Define at least one simple impact metric (hours, people reached, funds raised, outcomes)",
          done: false
        }
      ],
      suggestedNextStep:
        "Pick ONE activity and design a small project or event around it that you can ship within the next 6–8 weeks."
    },
    {
      id: "essays",
      title: "Essays & personal statement",
      description:
        "Translate your experiences into a focused narrative instead of listing everything again.",
      checklist: [
        {
          id: "storylines",
          label:
            "Brainstorm 3–4 possible personal stories that connect your background, interests, and impact",
          done: false
        },
        {
          id: "outline",
          label: "Create a simple outline for your main personal statement",
          done: false
        },
        {
          id: "feedback",
          label: "Ask one trusted adult to give feedback on clarity (not style)",
          done: false
        }
      ],
      suggestedNextStep:
        "Pick one story and write a rough, honest draft—no polishing yet, just getting everything on the page."
    },
    {
      id: "documents",
      title: "Recommendations & documents",
      description:
        "Make it easy for teachers and counselors to write strong, specific letters.",
      checklist: [
        {
          id: "shortlist-teachers",
          label:
            "Shortlist 2 teachers who know you well academically and personally",
          done: false
        },
        {
          id: "brag-sheet",
          label:
            "Prepare a 1–2 page ‘context sheet’ with your activities, interests, and examples of growth",
          done: false
        },
        {
          id: "deadlines",
          label: "Share a clear list of deadlines with each recommender",
          done: false
        }
      ],
      suggestedNextStep:
        "Ask your first recommender early, then send them a short, organized document that makes their job easier."
    },
    {
      id: "applications",
      title: "Applications & submission",
      description:
        "Translate your profile into polished, accurate forms without last‑minute panic.",
      checklist: [
        {
          id: "school-list",
          label:
            "Finalize a balanced list of reach, match, and safety universities",
          done: false
        },
        {
          id: "platforms",
          label:
            "Open accounts on relevant platforms (Common App, UCAS, university portals, etc.)",
          done: false
        },
        {
          id: "review",
          label:
            "Do a final consistency check across activities, essays, and recommendations",
          done: false
        }
      ],
      suggestedNextStep:
        "Choose one application platform and complete your basic profile details before touching essays again."
    }
  ];

  if (region === "USA") {
    base.push({
      id: "interviews",
      title: "Optional interviews",
      description:
        "Treat interviews as a conversation about fit, not a test you can ‘game’.",
      checklist: [
        {
          id: "research",
          label: "Research how each target school handles interviews",
          done: false
        },
        {
          id: "stories-interview",
          label:
            "Prepare 3 short stories that show curiosity, initiative, and impact",
          done: false
        }
      ],
      suggestedNextStep:
        "Write down a few concrete examples you can talk about comfortably, then practice explaining them out loud once."
    });
  }

  return base;
}


