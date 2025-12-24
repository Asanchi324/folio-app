import { useState } from "react";
import { extracurricularsDB, type ExtracurricularOpportunity } from "../data/extracurricularsDB";
import type { Activity } from "../types";

interface Props {
  onAddActivity: (activity: Activity) => void;
}

export function ExtracurricularsDB({ onAddActivity }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", ...Array.from(new Set(extracurricularsDB.map((e) => e.category)))];

  const filtered = extracurricularsDB.filter((opp) => {
    if (selectedCategory !== "All" && opp.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        opp.title.toLowerCase().includes(query) ||
        opp.description.toLowerCase().includes(query) ||
        opp.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleAddToPortfolio = (opp: ExtracurricularOpportunity) => {
    const activity: Activity = {
      id: crypto.randomUUID(),
      title: opp.title,
      role: "Participant",
      organization: opp.level,
      duration: "Ongoing",
      description: opp.description,
      category: opp.category as Activity["category"],
      importanceRank: 5,
      isOngoing: true
    };
    onAddActivity(activity);
  };

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-base font-bold text-ink mb-1">🎯 Discover Opportunities</h3>
        <p className="text-sm text-ink-soft">
          Browse competitions, olympiads, and programs to add to your portfolio.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search competitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border-2 border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((opp) => (
          <div
            key={opp.id}
            className="rounded-xl border-2 border-accent/20 bg-white p-4 shadow-subtle hover:shadow-subtle-lg transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h4 className="font-bold text-ink text-sm">{opp.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-dark">
                    {opp.category}
                  </span>
                  <span className="rounded-full bg-accent-soft/50 px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                    {opp.level}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-ink-soft mb-3 line-clamp-2">{opp.description}</p>
            {opp.eligibility && (
              <p className="text-[10px] text-ink-soft mb-3">
                <span className="font-semibold">Eligibility:</span> {opp.eligibility}
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              {opp.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {opp.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent-soft/30 px-2 py-0.5 text-[10px] text-ink-soft"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleAddToPortfolio(opp)}
                className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-dark transition-colors"
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-ink-soft">
          No opportunities found matching your criteria.
        </div>
      )}
    </div>
  );
}

