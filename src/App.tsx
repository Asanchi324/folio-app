import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { Extracurriculars } from "./components/Extracurriculars";
import { Roadmap } from "./components/Roadmap";
import { AdmissionsAI } from "./components/AdmissionsAI";
import { Universities } from "./components/Universities";
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

type Page = "portfolio" | "roadmap" | "ai" | "universities";

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
          <TabButton
            label="Universities"
            active={page === "universities"}
            onClick={() => setPage("universities")}
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
            <div className="rounded-xl border-2 border-accent/20 bg-gradient-to-br from-white to-accent-soft/30 p-4 text-sm text-ink-soft shadow-subtle">
              <div className="text-sm font-semibold text-ink mb-2">
                📖 How to read this estimate
              </div>
              <ul className="space-y-1 list-disc pl-5">
                <li>
                  Используй результат как ориентир для планирования, а не как
                  приговор.
                </li>
                <li>
                  Обращай больше внимания на разделы &quot;Areas to Improve&quot; и
                  &quot;Action Steps&quot;.
                </li>
              </ul>
            </div>
          </div>
        )}

        {page === "universities" && <Universities />}
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
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
        active
          ? "bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg"
          : "bg-white text-ink-soft border-2 border-accent/20 hover:text-accent hover:border-accent/40 hover:shadow-subtle"
      }`}
    >
      {label}
    </button>
  );
}



