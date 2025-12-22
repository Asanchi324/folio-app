export type ActivityCategory =
  | "Academic"
  | "Leadership"
  | "Sports"
  | "Volunteering"
  | "Research"
  | "Startup"
  | "Creative"
  | "Other";

export interface Activity {
  id: string;
  title: string;
  role: string;
  organization: string;
  duration: string;
  hoursPerWeek?: number;
  totalHours?: number;
  description: string;
  category: ActivityCategory;
  importanceRank: number;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
  aiEnhancedDescription?: string;
}

export type GradeLevel = "9" | "10" | "11" | "12" | "Gap";

export type TargetRegion = "USA" | "UK" | "Europe" | "Canada" | "Other";

export interface RoadmapChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  checklist: RoadmapChecklistItem[];
  suggestedNextStep: string;
}

export interface ProfileInputs {
  gpa: string;
  sat: string;
  ielts: string;
  toefl: string;
  intendedMajor: string;
  targetUniversities: string;
}

export type CompetitivenessLevel = "Reach" | "Match" | "Safety" | "Unclear";

export interface EvaluationResult {
  level: CompetitivenessLevel;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

 