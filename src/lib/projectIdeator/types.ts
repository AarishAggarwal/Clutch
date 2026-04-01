import { z } from "zod";

export const IDEA_MODES = [
  { id: "fast_brainstorm", label: "Fast brainstorm" },
  { id: "best_fit", label: "Best-fit ideas" },
  { id: "highly_unique", label: "Highly unique ideas" },
  { id: "elite_admissions", label: "Elite admissions ideas" },
  { id: "startup_worthy", label: "Startup-worthy ideas" },
  { id: "research_worthy", label: "Research-worthy ideas" },
  { id: "social_impact", label: "Social impact ideas" },
  { id: "competition", label: "Competition ideas" },
  { id: "budget_constrained", label: "Budget-constrained ideas" },
  { id: "beginner_friendly", label: "Beginner-friendly ideas" },
] as const;

export type IdeaModeId = (typeof IDEA_MODES)[number]["id"];

export type IntakeProfile = {
  gradeLevel: string;
  intendedMajors: string;
  careerInterests: string;
  skillLevel: "beginner" | "intermediate" | "advanced" | "";
  skills: string;
  projectTypes: string[];
  timeAvailable: string;
  budgetRange: string;
  teamOrSolo: "solo" | "team" | "either" | "";
  mentorAccess: boolean | null;
  ambition: "safe" | "strong" | "elite" | "";
  targetOutcomes: string[];
  region: string;
  resources: string;
  preferLocalProblems: boolean;
  buildPace: "fast" | "deep" | "";
};

export const defaultIntakeProfile = (): IntakeProfile => ({
  gradeLevel: "",
  intendedMajors: "",
  careerInterests: "",
  skillLevel: "",
  skills: "",
  projectTypes: [],
  timeAvailable: "",
  budgetRange: "",
  teamOrSolo: "",
  mentorAccess: null,
  ambition: "",
  targetOutcomes: [],
  region: "",
  resources: "",
  preferLocalProblems: false,
  buildPace: "",
});

export type IdeaFilters = {
  domains: string[];
  maxWeeks: string;
  budget: "" | "low" | "medium" | "high";
  maxDifficulty: string;
  coding: "" | "required" | "optional" | "none";
  hardware: "" | "yes" | "no" | "either";
  impactScope: "" | "local" | "scalable" | "either";
};

export const defaultIdeaFilters = (): IdeaFilters => ({
  domains: [],
  maxWeeks: "",
  budget: "",
  maxDifficulty: "",
  coding: "",
  hardware: "",
  impactScope: "",
});

export const projectIdeaSchema = z.object({
  title: z.string(),
  oneLineConcept: z.string(),
  whyStrong: z.string(),
  problemStatement: z.string(),
  solutionConcept: z.string(),
  targetUsers: z.string(),
  uniqueness: z.string(),
  skillsRequired: z.string(),
  executionPhases: z.object({
    phase1: z.string(),
    phase2: z.string(),
    phase3: z.string(),
    phase4: z.string(),
  }),
  toolsTechStack: z.string(),
  timelineEstimate: z.string(),
  budgetEstimate: z.string(),
  scores: z.object({
    difficulty: z.coerce.number().min(1).max(10),
    originality: z.coerce.number().min(1).max(10),
    admissionsImpact: z.coerce.number().min(1).max(10),
    feasibility: z.coerce.number().min(1).max(10),
  }),
  bestFitFor: z.string(),
  howToMakeStronger: z.string(),
  firstSevenDays: z.string(),
  compositeRank: z.coerce.number().optional(),
});

export type ProjectIdea = z.infer<typeof projectIdeaSchema>;

export const ideatorResponseSchema = z.object({
  assistantReply: z.string(),
  ideas: z.array(projectIdeaSchema).min(1).max(10),
});

export type IdeatorResponse = z.infer<typeof ideatorResponseSchema>;

export type SavedIdeaEntry = {
  id: string;
  savedAt: string;
  favorite: boolean;
  idea: ProjectIdea;
  mode?: IdeaModeId;
};

export function normalizeIntakeProfile(p: Partial<IntakeProfile> & Record<string, unknown>): IntakeProfile {
  const d = defaultIntakeProfile();
  return {
    ...d,
    ...p,
    projectTypes: Array.isArray(p.projectTypes) ? (p.projectTypes as string[]).filter(Boolean) : d.projectTypes,
    targetOutcomes: Array.isArray(p.targetOutcomes) ? (p.targetOutcomes as string[]).filter(Boolean) : d.targetOutcomes,
    mentorAccess:
      typeof p.mentorAccess === "boolean" ? p.mentorAccess : p.mentorAccess === null ? null : d.mentorAccess,
    preferLocalProblems: typeof p.preferLocalProblems === "boolean" ? p.preferLocalProblems : d.preferLocalProblems,
  };
}

export function normalizeIdeaFilters(f: Partial<IdeaFilters> & Record<string, unknown>): IdeaFilters {
  const d = defaultIdeaFilters();
  return {
    ...d,
    ...f,
    domains: Array.isArray(f.domains) ? (f.domains as string[]).filter(Boolean) : d.domains,
  };
}
