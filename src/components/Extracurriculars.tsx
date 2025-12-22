import { useMemo, useState } from "react";
import type { Activity, ActivityCategory } from "../types";
import { improveActivityDescription } from "../ai/mockAi";

interface Props {
  activities: Activity[];
  onChange: (activities: Activity[]) => void;
}

type ViewMode = "cards" | "ranked" | "timeline";

const CATEGORIES: ActivityCategory[] = [
  "Academic",
  "Leadership",
  "Sports",
  "Volunteering",
  "Research",
  "Startup",
  "Creative",
  "Other"
];

export function Extracurriculars({ activities, onChange }: Props) {
  const [view, setView] = useState<ViewMode>("cards");
  const [editing, setEditing] = useState<Activity | null>(null);
  const [isImproving, setIsImproving] = useState<string | null>(null);

  const sortedByRank = useMemo(
    () => [...activities].sort((a, b) => a.importanceRank - b.importanceRank),
    [activities]
  );

  const handleSave = (activity: Activity) => {
    const idx = activities.findIndex((a) => a.id === activity.id);
    const next =
      idx === -1
        ? [...activities, activity]
        : activities.map((a) => (a.id === activity.id ? activity : a));
    onChange(next);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    onChange(activities.filter((a) => a.id !== id));
  };

  const handleImprove = async (activity: Activity) => {
    try {
      setIsImproving(activity.id);
      const improved = await improveActivityDescription(activity);
      onChange(
        activities.map((a) =>
          a.id === activity.id ? { ...a, aiEnhancedDescription: improved } : a
        )
      );
    } finally {
      setIsImproving(null);
    }
  };

  return (
    <section className="flex-1 space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            Extracurricular portfolio
          </h2>
          <p className="text-xs text-ink-soft">
            Capture your key activities in application‑ready language. AI
            editing is completely optional.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-ink text-xs font-medium text-white px-3 py-1.5 hover:bg-slate-900 transition-colors"
          onClick={() =>
            setEditing({
              id: crypto.randomUUID(),
              title: "",
              role: "",
              organization: "",
              duration: "",
              description: "",
              hoursPerWeek: undefined,
              totalHours: undefined,
              category: "Other",
              importanceRank: activities.length + 1
            })
          }
        >
          + Add activity
        </button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-1 py-1 text-[11px] shadow-subtle">
          {(["cards", "ranked", "timeline"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`rounded-full px-2 py-0.5 capitalize ${
                view === mode
                  ? "bg-ink text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-ink-soft">
          Aim for 8–12 meaningful activities. Depth matters more than volume.
        </span>
      </div>

      {activities.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-border bg-surface-elevated px-4 py-6 text-xs text-ink-soft text-center">
          Start by adding 2–3 activities that genuinely matter to you—clubs,
          competitions, projects, work, or volunteering. You can refine the
          wording later.
        </div>
      )}

      <div className="space-y-3">
        {view === "cards" && (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedByRank.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={() => setEditing(activity)}
                onDelete={() => handleDelete(activity.id)}
                onImprove={() => handleImprove(activity)}
                improving={isImproving === activity.id}
              />
            ))}
          </div>
        )}

        {view === "ranked" && (
          <ol className="space-y-2 text-xs">
            {sortedByRank.map((activity) => (
              <li
                key={activity.id}
                className="flex items-start gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2"
              >
                <span className="mt-0.5 text-[11px] font-semibold text-ink-soft">
                  #{activity.importanceRank}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-[11px] text-ink-soft">
                        {activity.role} • {activity.organization}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-[11px] text-accent hover:underline"
                      onClick={() => setEditing(activity)}
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[11px] text-ink-soft">
                    {activity.aiEnhancedDescription ?? activity.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {view === "timeline" && (
          <div className="relative space-y-3 text-xs">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
            {sortedByRank.map((activity) => (
              <div key={activity.id} className="relative flex gap-3 pl-5">
                <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-accent-soft ring-2 ring-accent" />
                <div className="flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium">
                        {activity.title}
                      </div>
                      <div className="text-[11px] text-ink-soft">
                        {activity.duration || "Add dates"} •{" "}
                        {activity.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-[11px] text-accent hover:underline"
                      onClick={() => setEditing(activity)}
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[11px] text-ink-soft">
                    {activity.aiEnhancedDescription ?? activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <ActivityEditor
            key={editing.id}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={handleSave}
          />
        )}
      </div>
    </section>
  );
}

interface CardProps {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  onImprove: () => void;
  improving: boolean;
}

function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onImprove,
  improving
}: CardProps) {
  const description = activity.aiEnhancedDescription ?? activity.description;

  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface-elevated p-3 shadow-subtle text-xs">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold">{activity.title}</h3>
          <div className="text-[11px] text-ink-soft">
            {activity.role} • {activity.organization}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-soft">
            {activity.duration || "Add dates"} • {activity.category}
          </div>
        </div>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-ink-soft">
          #{activity.importanceRank}
        </span>
      </header>
      <p className="mt-2 flex-1 text-[11px] text-ink-soft">{description}</p>
      <footer className="mt-3 flex items-center justify-between gap-2">
        <div className="text-[10px] text-ink-soft">
          {activity.hoursPerWeek
            ? `${activity.hoursPerWeek} hrs/week`
            : "Add hours"}
          {activity.totalHours ? ` • ${activity.totalHours} hrs total` : ""}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onImprove}
            className="rounded-full border border-border bg-surface px-2 py-1 text-[10px] text-ink-soft hover:border-accent hover:text-accent"
          >
            {improving ? "Improving…" : "Improve description"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-transparent px-2 py-1 text-[10px] text-ink-soft hover:border-border"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-transparent px-2 py-1 text-[10px] text-danger hover:border-danger/20"
          >
            Remove
          </button>
        </div>
      </footer>
    </article>
  );
}

interface EditorProps {
  initial: Activity;
  onSave: (activity: Activity) => void;
  onCancel: () => void;
}

function ActivityEditor({ initial, onSave, onCancel }: EditorProps) {
  const [draft, setDraft] = useState<Activity>(initial);

  const handleChange = (
    field: keyof Activity,
    value: string | number | boolean | ActivityCategory | undefined
  ) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(draft);
  };

  return (
    <div className="fade-in rounded-xl border border-border bg-surface-elevated p-3 text-xs shadow-subtle">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-semibold text-xs">Edit activity</div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-ink-soft hover:underline"
        >
          Close
        </button>
      </div>
      <form
        className="grid gap-2 md:grid-cols-2"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">Title</span>
          <input
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={draft.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Debate Club, Robotics Team, Tutoring Project…"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">Role</span>
          <input
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={draft.role}
            onChange={(e) => handleChange("role", e.target.value)}
            placeholder="Member, Captain, Founder, Coordinator…"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">Organization</span>
          <input
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={draft.organization}
            onChange={(e) => handleChange("organization", e.target.value)}
            placeholder="School name, local NGO, online platform…"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">Duration</span>
          <input
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={draft.duration}
            onChange={(e) => handleChange("duration", e.target.value)}
            placeholder="Sep 2023 – Present, 2 years, one summer…"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">Hours per week</span>
          <input
            type="number"
            min={0}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={draft.hoursPerWeek ?? ""}
            onChange={(e) =>
              handleChange(
                "hoursPerWeek",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder="e.g. 3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">Total hours</span>
          <input
            type="number"
            min={0}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={draft.totalHours ?? ""}
            onChange={(e) =>
              handleChange(
                "totalHours",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder="Approximate total"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">Category</span>
          <select
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={draft.category}
            onChange={(e) =>
              handleChange("category", e.target.value as ActivityCategory)
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">Importance rank</span>
          <input
            type="number"
            min={1}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={draft.importanceRank}
            onChange={(e) =>
              handleChange(
                "importanceRank",
                e.target.value ? Number(e.target.value) : 1
              )
            }
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1">
          <span className="text-[11px] text-ink-soft">
            Description (plain, honest language)
          </span>
          <textarea
            className="min-h-[80px] rounded-lg border border-border bg-surface px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={draft.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe what you actually did, who you worked with, and what changed because of your actions."
          />
          <span className="text-[10px] text-ink-soft">
            Keep this honest and specific. You can use AI later to polish the
            wording without adding anything that didn&apos;t happen.
          </span>
        </label>
        <div className="md:col-span-2 flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-3 py-1 text-[11px] text-ink-soft hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
          >
            Save activity
          </button>
        </div>
      </form>
    </div>
  );
}


