export const essayTypes = [
  { id: "common_app_personal_statement", label: "Common App Personal Statement" },
  { id: "supplemental_essay", label: "Supplemental Essay" },
  { id: "uc_piq", label: "UC PIQ" },
  { id: "activity_description", label: "Activity Description" },
] as const;

export type EssayType = (typeof essayTypes)[number]["id"];

export type SupplementalPrompt = {
  id: string;
  cycleYear: string;
  question: string;
  /** Word or character limit when known, e.g. "250 words max" */
  wordLimit?: string;
  /** Required / Optional / Choose one — informational for UI */
  kind?: "required" | "optional" | "choose_one" | "list" | "short_take";
};

export type SupplementalUniversity = {
  /** Stable id for chat/API; matches `slug` for new catalog entries */
  id: string;
  /** Matches Prisma / College Scorecard slug (essays shortlist) */
  slug: string;
  name: string;
  /** Plain-text deadline summary from the latest verified cycle */
  submissionDeadlines?: string;
  prompts: SupplementalPrompt[];
};

export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessageType =
  | "plain_text"
  | "essay_submission"
  | "fused_result"
  | "model_result"
  | "meta";

export type ModelProvider = "openai" | "deepseek";

export type FusedEvaluationMode = "single-model" | "dual-model";

