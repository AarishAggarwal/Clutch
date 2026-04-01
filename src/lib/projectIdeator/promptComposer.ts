import type { IdeaFilters, IdeaModeId, IntakeProfile } from "@/lib/projectIdeator/types";

export type ComposerMessage = { role: "user" | "assistant"; content: string };

export function buildIdeatorUserPayload(params: {
  profile: IntakeProfile;
  mode: IdeaModeId;
  filters: IdeaFilters;
  ideaCount: number;
  messages: ComposerMessage[];
  userMessage: string;
}): string {
  const { profile, mode, filters, ideaCount, messages, userMessage } = params;
  const count = Math.min(7, Math.max(1, ideaCount));

  const profileBlock = [
    `Grade level: ${profile.gradeLevel || "not specified"}`,
    `Intended majors / academic interests: ${profile.intendedMajors || "not specified"}`,
    `Career interests: ${profile.careerInterests || "not specified"}`,
    `Self-reported skill level: ${profile.skillLevel || "not specified"}`,
    `Existing skills (coding, robotics, design, research, writing, outreach, leadership…): ${profile.skills || "not specified"}`,
    `Preferred project types: ${profile.projectTypes.length ? profile.projectTypes.join(", ") : "not specified"}`,
    `Time available: ${profile.timeAvailable || "not specified"}`,
    `Budget range: ${profile.budgetRange || "not specified"}`,
    `Solo vs team: ${profile.teamOrSolo || "not specified"}`,
    `Mentor / lab access: ${profile.mentorAccess === null ? "not specified" : profile.mentorAccess ? "yes" : "no"}`,
    `Ambition level: ${profile.ambition || "not specified"} (safe = conservative scope, strong = competitive, elite = highly differentiated)`,
    `Desired outcomes: ${profile.targetOutcomes.length ? profile.targetOutcomes.join(", ") : "not specified"}`,
    `Country / region: ${profile.region || "not specified"}`,
    `Available resources (lab, laptop only, phone, sensors…): ${profile.resources || "not specified"}`,
    `Prefer local-problem-based ideas: ${profile.preferLocalProblems ? "yes" : "no"}`,
    `Build pace preference: ${profile.buildPace || "not specified"} (fast = ship MVP quickly, deep = longer arc)`,
  ].join("\n");

  const filterBlock = [
    `Domain tags: ${filters.domains.length ? filters.domains.join(", ") : "none"}`,
    `Max timeline (weeks): ${filters.maxWeeks || "not specified"}`,
    `Budget filter: ${filters.budget || "not specified"}`,
    `Max difficulty (1–10): ${filters.maxDifficulty || "not specified"}`,
    `Coding: ${filters.coding || "not specified"}`,
    `Hardware: ${filters.hardware || "not specified"}`,
    `Impact scope: ${filters.impactScope || "not specified"}`,
  ].join("\n");

  const modeHints: Record<IdeaModeId, string> = {
    fast_brainstorm: "Prioritize speed and breadth; slightly lighter depth per idea but still non-generic.",
    best_fit: "Maximize fit to stated majors/skills/time; feasibility weighted highly.",
    highly_unique: "Maximize novelty and domain crosses; accept slightly harder execution.",
    elite_admissions: "Maximize narrative + differentiation + evidence potential for selective admissions.",
    startup_worthy: "Emphasize user pain, wedge, iteration loops, light GTM.",
    research_worthy: "Emphasize hypotheses, data, methods, publication/poster path.",
    social_impact: "Emphasize measurable beneficiary outcomes and ethical safeguards.",
    competition: "Emphasize judging criteria fit, demo-ability, documentation.",
    budget_constrained: "Strictly respect low budget; prefer no-code/low-code and free tiers.",
    beginner_friendly: "Cap difficulty scores ≤6 unless student insists; small scope.",
  };

  const transcript =
    messages.length === 0
      ? "(no prior messages)"
      : messages
          .slice(-24)
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n\n");

  return [
    `GENERATION_MODE: ${mode}`,
    `MODE_INSTRUCTIONS: ${modeHints[mode]}`,
    `TARGET_IDEA_COUNT: ${count}`,
    "",
    "## Student intake",
    profileBlock,
    "",
    "## Filters",
    filterBlock,
    "",
    "## Conversation transcript",
    transcript,
    "",
    "## Latest user message / request",
    userMessage.trim() || "(generate initial ideas from profile only)",
    "",
    `Respond with JSON only. Include exactly TARGET_IDEA_COUNT items in "ideas" when defensible; if constraints make that impossible, return as many strong ideas as possible (minimum 1) and explain in assistantReply.`,
  ].join("\n");
}
