import type { GradeLevel, TargetRegion } from "../types";

interface LayoutProps {
  gradeLevel: GradeLevel;
  region: TargetRegion;
  onGradeChange: (grade: GradeLevel) => void;
  onRegionChange: (region: TargetRegion) => void;
  userEmail?: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  children: React.ReactNode;
}

export function Layout({
  gradeLevel,
  region,
  onGradeChange,
  onRegionChange,
  userEmail,
  onSignIn,
  onSignOut,
  children
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="border-b border-border bg-surface-elevated sticky top-0 z-20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-sm font-semibold text-accent">
              F
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Folio</div>
              <div className="text-xs text-ink-soft">
                Your extracurriculars, roadmap, and odds—clarified.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1 rounded-full bg-surface px-2 py-1 shadow-subtle">
              <span className="text-ink-soft">Grade</span>
              <select
                className="rounded-full border border-border bg-surface-elevated px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                value={gradeLevel}
                onChange={(e) => onGradeChange(e.target.value as GradeLevel)}
              >
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="Gap">Gap year</option>
              </select>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-surface px-2 py-1 shadow-subtle">
              <span className="text-ink-soft">Target region</span>
              <select
                className="rounded-full border border-border bg-surface-elevated px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                value={region}
                onChange={(e) =>
                  onRegionChange(e.target.value as TargetRegion)
                }
              >
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Europe">Europe</option>
                <option value="Canada">Canada</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              {userEmail ? (
                <>
                  <span className="max-w-[120px] truncate text-ink-soft">
                    {userEmail}
                  </span>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="rounded-full border border-border bg-surface-elevated px-2 py-1 text-[11px] text-ink-soft hover:bg-surface"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
                >
                  Войти с Google
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row">
        {children}
      </main>
    </div>
  );
}

 