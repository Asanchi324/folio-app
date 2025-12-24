import { useState, useMemo } from "react";
import { universitiesDB } from "../data/universitiesDB";
import type { TargetRegion } from "../types";

export function Universities() {
  const [selectedRegion, setSelectedRegion] = useState<TargetRegion | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUni, setSelectedUni] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = universitiesDB;

    if (selectedRegion !== "All") {
      result = result.filter((uni) => uni.region === selectedRegion);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (uni) =>
          uni.name.toLowerCase().includes(query) ||
          uni.city.toLowerCase().includes(query) ||
          uni.notablePrograms?.some((p) => p.toLowerCase().includes(query))
      );
    }

    return result;
  }, [selectedRegion, searchQuery]);

  const selectedUniversity = selectedUni
    ? universitiesDB.find((u) => u.id === selectedUni)
    : null;

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-bold tracking-tight text-ink">
          🏛️ University Database
        </h2>
        <p className="text-sm text-ink-soft mt-1">
          Explore universities, their requirements, and admission statistics.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search universities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value as TargetRegion | "All")}
          className="rounded-xl border-2 border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="All">All Regions</option>
          <option value="USA">USA</option>
          <option value="UK">UK</option>
          <option value="Europe">Europe</option>
          <option value="Canada">Canada</option>
        </select>
      </div>

      {selectedUniversity ? (
        <UniversityDetail
          university={selectedUniversity}
          onClose={() => setSelectedUni(null)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((uni) => (
            <UniversityCard
              key={uni.id}
              university={uni}
              onClick={() => setSelectedUni(uni.id)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-ink-soft">
          No universities found matching your criteria.
        </div>
      )}
    </section>
  );
}

interface UniversityCardProps {
  university: typeof universitiesDB[0];
  onClick: () => void;
}

function UniversityCard({ university, onClick }: UniversityCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border-2 border-accent/20 bg-white p-5 shadow-subtle hover:shadow-subtle-lg hover:border-accent/40 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-ink text-base group-hover:text-accent transition-colors">
            {university.name}
          </h3>
          <p className="text-sm text-ink-soft mt-0.5">
            {university.city}, {university.country}
          </p>
        </div>
        {university.ranking?.usNews && (
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent whitespace-nowrap">
            #{university.ranking.usNews}
          </span>
        )}
      </div>

      {university.imageUrl && (
        <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-accent-soft/20">
          <img
            src={university.imageUrl}
            alt={university.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="space-y-2 text-xs">
        {university.requirements.sat?.median && (
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">SAT Median:</span>
            <span className="font-semibold text-ink">{university.requirements.sat.median}</span>
          </div>
        )}
        {university.requirements.gpa?.median && (
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">GPA Median:</span>
            <span className="font-semibold text-ink">{university.requirements.gpa.median}</span>
          </div>
        )}
        {university.acceptanceRate && (
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Acceptance Rate:</span>
            <span className="font-semibold text-ink">{university.acceptanceRate}%</span>
          </div>
        )}
      </div>

      {university.notablePrograms && university.notablePrograms.length > 0 && (
        <div className="mt-3 pt-3 border-t border-accent/10">
          <div className="flex flex-wrap gap-1">
            {university.notablePrograms.slice(0, 2).map((program) => (
              <span
                key={program}
                className="rounded-full bg-accent-soft/50 px-2 py-0.5 text-[10px] font-medium text-accent-dark"
              >
                {program}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

interface UniversityDetailProps {
  university: typeof universitiesDB[0];
  onClose: () => void;
}

function UniversityDetail({ university, onClose }: UniversityDetailProps) {
  const reqs = university.requirements;

  return (
    <div className="rounded-2xl border-2 border-accent/30 bg-white p-6 shadow-subtle-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-ink mb-1">{university.name}</h2>
          <p className="text-ink-soft">
            {university.city}, {university.country}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-surface-elevated px-4 py-2 text-sm font-medium text-ink-soft hover:bg-accent-soft hover:text-accent transition-colors"
        >
          ← Back
        </button>
      </div>

      {university.imageUrl && (
        <div className="w-full h-48 rounded-xl overflow-hidden mb-5 bg-accent-soft/20">
          <img
            src={university.imageUrl}
            alt={university.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <p className="text-sm text-ink leading-relaxed mb-5">{university.description}</p>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-xl border-2 border-accent/20 bg-accent-soft/10 p-4">
          <h3 className="font-bold text-ink mb-3">Admission Requirements</h3>
          <div className="space-y-2 text-sm">
            {reqs.sat?.median && (
              <div className="flex justify-between">
                <span className="text-ink-soft">SAT:</span>
                <span className="font-semibold text-ink">
                  {reqs.sat.range
                    ? `${reqs.sat.range.min}-${reqs.sat.range.max}`
                    : `Median: ${reqs.sat.median}`}
                  {!reqs.sat.required && " (optional)"}
                </span>
              </div>
            )}
            {reqs.act?.median && (
              <div className="flex justify-between">
                <span className="text-ink-soft">ACT:</span>
                <span className="font-semibold text-ink">
                  {reqs.act.range
                    ? `${reqs.act.range.min}-${reqs.act.range.max}`
                    : `Median: ${reqs.act.median}`}
                  {!reqs.act.required && " (optional)"}
                </span>
              </div>
            )}
            {reqs.gpa?.median && (
              <div className="flex justify-between">
                <span className="text-ink-soft">GPA:</span>
                <span className="font-semibold text-ink">
                  {reqs.gpa.min ? `Min: ${reqs.gpa.min}, ` : ""}
                  Median: {reqs.gpa.median}
                  {reqs.gpa.weighted && " (weighted)"}
                </span>
              </div>
            )}
            {reqs.ielts?.min && (
              <div className="flex justify-between">
                <span className="text-ink-soft">IELTS:</span>
                <span className="font-semibold text-ink">
                  Min: {reqs.ielts.min}
                  {!reqs.ielts.required && " (optional)"}
                </span>
              </div>
            )}
            {reqs.toefl?.min && (
              <div className="flex justify-between">
                <span className="text-ink-soft">TOEFL:</span>
                <span className="font-semibold text-ink">
                  Min: {reqs.toefl.min}
                  {!reqs.toefl.required && " (optional)"}
                </span>
              </div>
            )}
            {reqs.aLevels?.minGrades && (
              <div className="flex justify-between">
                <span className="text-ink-soft">A-Levels:</span>
                <span className="font-semibold text-ink">
                  {reqs.aLevels.minGrades}
                  {!reqs.aLevels.required && " (optional)"}
                </span>
              </div>
            )}
            {reqs.ib?.min && (
              <div className="flex justify-between">
                <span className="text-ink-soft">IB:</span>
                <span className="font-semibold text-ink">
                  Min: {reqs.ib.min}
                  {!reqs.ib.required && " (optional)"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border-2 border-accent/20 bg-accent-soft/10 p-4">
          <h3 className="font-bold text-ink mb-3">Statistics</h3>
          <div className="space-y-2 text-sm">
            {university.acceptanceRate && (
              <div className="flex justify-between">
                <span className="text-ink-soft">Acceptance Rate:</span>
                <span className="font-semibold text-ink">
                  {university.acceptanceRate}%
                </span>
              </div>
            )}
            {university.ranking?.usNews && (
              <div className="flex justify-between">
                <span className="text-ink-soft">US News Ranking:</span>
                <span className="font-semibold text-ink">#{university.ranking.usNews}</span>
              </div>
            )}
            {university.ranking?.qs && (
              <div className="flex justify-between">
                <span className="text-ink-soft">QS Ranking:</span>
                <span className="font-semibold text-ink">#{university.ranking.qs}</span>
              </div>
            )}
            {university.ranking?.times && (
              <div className="flex justify-between">
                <span className="text-ink-soft">Times Ranking:</span>
                <span className="font-semibold text-ink">#{university.ranking.times}</span>
              </div>
            )}
            {university.applicationDeadline && (
              <div className="flex justify-between">
                <span className="text-ink-soft">Application Deadline:</span>
                <span className="font-semibold text-ink text-xs">
                  {university.applicationDeadline}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {university.notablePrograms && university.notablePrograms.length > 0 && (
        <div className="mb-5">
          <h3 className="font-bold text-ink mb-2">Notable Programs</h3>
          <div className="flex flex-wrap gap-2">
            {university.notablePrograms.map((program) => (
              <span
                key={program}
                className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-dark"
              >
                {program}
              </span>
            ))}
          </div>
        </div>
      )}

      <a
        href={university.website}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-dark px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
      >
        Visit Official Website →
      </a>
    </div>
  );
}

