import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { Extracurriculars } from "./components/Extracurriculars";
import { Roadmap } from "./components/Roadmap";
import { AdmissionsAI } from "./components/AdmissionsAI";
import type {
  Activity,
  GradeLevel,
  RoadmapStage,
  TargetRegion
} from "./types";
import {
  loadActivitiesForUser,
  saveActivitiesForUser,
  signInWithGoogle,
  signOutUser,
  subscribeToAuth
} from "./firebase";
import type { User } from "firebase/auth";

type Page = "portfolio" | "roadmap" | "ai";

export default function App() {
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("11");
  const [region, setRegion] = useState<TargetRegion>("USA");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [page, setPage] = useState<Page>("portfolio");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load activities for this user
        const loaded = await loadActivitiesForUser(firebaseUser.uid);
        setActivities(loaded);
      } else {
        setActivities([]);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    // Fire and forget save; если вдруг нет интернета, просто не сохранится
    void saveActivitiesForUser(user.uid, activities);
  }, [activities, user]);

  return (
    <Layout
      gradeLevel={gradeLevel}
      region={region}
      onGradeChange={setGradeLevel}
      onRegionChange={setRegion}
      userEmail={user?.email ?? null}
      onSignIn={() => signInWithGoogle()}
      onSignOut={() => signOutUser()}
    >
      <div className="flex-1 lg:pr-4">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <TabButton
            label="Portfolio"
            active={page === "portfolio"}
            onClick={() => setPage("portfolio")}
          />
          <TabButton
            label="Roadmap"
            active={page === "roadmap"}
            onClick={() => setPage("roadmap")}
          />
          <TabButton
            label="AI review"
            active={page === "ai"}
            onClick={() => setPage("ai")}
          />
        </nav>

        {authLoading && (
          <div className="mb-2 text-[11px] text-ink-soft">
            Проверяем, есть ли сохранённый аккаунт…
          </div>
        )}

        {page === "portfolio" && (
          <Extracurriculars activities={activities} onChange={setActivities} />
        )}

        {page === "roadmap" && (
          <Roadmap
            gradeLevel={gradeLevel}
            region={region}
            stages={stages}
            onChange={setStages}
          />
        )}

        {page === "ai" && (
          <div className="space-y-4">
            <AdmissionsAI activities={activities} />
            <div className="rounded-xl border border-border bg-surface-elevated p-3 text-[11px] text-ink-soft shadow-subtle">
              <div className="text-xs font-semibold text-ink">
                How to read this estimate
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>
                  Используй результат как ориентир для планирования, а не как
                  приговор.
                </li>
                <li>
                  Обращай больше внимания на разделы &quot;Gaps&quot; и
                  &quot;Specific next moves&quot;.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs transition-colors ${
        active
          ? "bg-ink text-white shadow-subtle"
          : "bg-surface-elevated text-ink-soft border border-border hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}



