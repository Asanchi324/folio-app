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
    <div className="min-h-screen bg-gradient-to-br from-white via-accent-soft/10 to-white text-ink">
      <header className="border-b-2 border-accent/20 bg-white/80 backdrop-blur-lg sticky top-0 z-20 shadow-subtle">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark text-white text-lg font-bold shadow-lg">
              F
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-ink">Folio</div>
              <div className="text-xs text-ink-soft">
                Your extracurriculars, roadmap, and odds—clarified.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1 rounded-full bg-white border-2 border-accent/20 px-3 py-1.5 shadow-subtle">
              <span className="text-ink-soft text-xs">Grade</span>
              <select
                className="rounded-full border-0 bg-transparent px-2 py-1 text-xs font-medium text-ink focus:outline-none focus:ring-0"
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
            <div className="flex items-center gap-1 rounded-full bg-white border-2 border-accent/20 px-3 py-1.5 shadow-subtle">
              <span className="text-ink-soft text-xs">Target region</span>
              <select
                className="rounded-full border-0 bg-transparent px-2 py-1 text-xs font-medium text-ink focus:outline-none focus:ring-0"
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
                  <span className="max-w-[120px] truncate text-ink-soft text-xs">
                    {userEmail}
                  </span>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="rounded-full border-2 border-accent/20 bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-accent-soft hover:text-accent transition-colors"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="rounded-full bg-gradient-to-r from-accent to-accent-dark px-4 py-2 text-xs font-semibold text-white shadow-lg hover:shadow-xl transition-all"
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

 