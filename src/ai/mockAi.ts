import { Activity, EvaluationResult, ProfileInputs } from "../types";

export async function improveActivityDescription(
  activity: Activity
): Promise<string> {
  const base = activity.description.trim();

  const emphasis: string[] = [];
  if (/led|organized|founded|captain|president/i.test(base)) {
    emphasis.push("leadership");
  }
  if (/tutored|mentored|volunteer|community|outreach/i.test(base)) {
    emphasis.push("community impact");
  }
  if (/research|paper|competition|olympiad|hackathon/i.test(base)) {
    emphasis.push("academic initiative");
  }

  const emphasisText =
    emphasis.length > 0
      ? `, highlighting your ${emphasis.join(" and ")}`
      : ", emphasizing clear initiative and measurable results";

  return `Led and sustained the role of ${activity.role || "a key member"} at ${
    activity.organization || "this activity"
  }, investing approximately ${
    activity.hoursPerWeek ?? "X"
  } hours per week to drive meaningful outcomes. ${base} This description focuses on concrete actions, scale, and results${emphasisText}, without exaggerating or adding achievements you did not actually complete.`;
}

export async function evaluateProfile(
  profile: ProfileInputs,
  activities: Activity[]
): Promise<EvaluationResult> {
  const sat = Number(profile.sat) || 0;
  const gpa = Number(profile.gpa) || 0;

  let level: EvaluationResult["level"] = "Unclear";
  if (sat >= 1480 && gpa >= 3.8) level = "Reach";
  else if (sat >= 1350 && gpa >= 3.6) level = "Match";
  else if (sat > 0 && gpa > 0) level = "Safety";

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  const leadershipActivities = activities.filter((a) =>
    /lead|captain|president|head|founder/i.test(a.role)
  );
  const longTermActivities = activities.filter(
    (a) => a.duration.toLowerCase().includes("year") || a.isOngoing
  );
  const volunteeringActivities = activities.filter(
    (a) => a.category === "Volunteering"
  );
  const academicActivities = activities.filter(
    (a) => a.category === "Academic" || a.category === "Research"
  );

  if (leadershipActivities.length > 0) {
    strengths.push(
      "You already demonstrate leadership through roles such as " +
        leadershipActivities
          .slice(0, 2)
          .map((a) => `${a.role} in ${a.title}`)
          .join(", ")
    );
  } else {
    weaknesses.push("Limited formal leadership roles across activities.");
    suggestions.push(
      "Add leadership depth in at least one existing activity (e.g., run a project, coordinate a small team, or formalize your role)."
    );
  }

  if (longTermActivities.length > 0) {
    strengths.push(
      "You show consistency through multi‑year or ongoing commitments."
    );
  } else {
    weaknesses.push(
      "Most activities appear short‑term; selective universities value sustained involvement."
    );
    suggestions.push(
      "Convert one volunteering or club activity into a 1–2 year project with clear milestones and outcomes."
    );
  }

  if (academicActivities.length > 0) {
    strengths.push(
      "You have an academic or research spike that can support your intended major."
    );
  } else {
    weaknesses.push(
      "Your extracurriculars do not yet clearly support your intended academic spike."
    );
    suggestions.push(
      "Strengthen an academic spike aligned with your intended major (e.g., competitions, research, online courses, or building a project)."
    );
  }

  if (volunteeringActivities.length > 0) {
    suggestions.push(
      "Consider converting one volunteering activity into a structured, long‑term initiative with clear impact metrics (hours, people reached, funds raised)."
    );
  }

  if (!profile.intendedMajor) {
    weaknesses.push("Intended major is not specified.");
    suggestions.push(
      "Clarify a tentative intended major so your activities and essays can tell a focused story."
    );
  }

  const summary =
    level === "Unclear"
      ? "With the current information, your overall competitiveness is hard to estimate. Adding test scores, GPA, and clearer activity details will unlock a more precise view."
      : `Based on your academic indicators and extracurricular pattern, your overall profile currently looks like a **${level}** level for many of your target universities.`;

  return {
    level,
    summary,
    strengths,
    weaknesses,
    suggestions
  };
}

 