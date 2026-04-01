import type { EssayType } from "@/lib/types";
import { rubricDimensions } from "@/lib/evaluationSchema";

const REQUIRED_JSON_SHAPE = (() => {
  const rubricExample = rubricDimensions
    .map(
      (d) =>
        `    { "dimension": "${d}", "score": number, "reason": string }`,
    )
    .join(",\n");

  return `{
  "overall_score": number,
  "essay_summary": string,
  "rubric_scores": [
${rubricExample}
  ],
  "strengths": [string, string, string],
  "weaknesses": [string, string, string],
  "paragraph_feedback": [
    { "paragraph_number": number, "feedback": string }
  ],
  "sentence_level_edits": [
    { "original": string, "suggestion": string, "reason": string }
  ],
  "revision_plan": [string],
  "final_verdict": string
}`;
})();

export function buildEssayEvaluationPrompts(params: {
  essayType: EssayType;
  essayText: string;
  supplementalContext?: {
    universityName: string;
    promptQuestion: string;
    cycleYear: string;
  };
  activitiesContext?: string;
}) {
  const { essayType, essayText, supplementalContext, activitiesContext } = params;

  const system = [
    "You are an elite, critical college admissions reviewer.",
    "You must be fair, analytical, and specific. Avoid generic praise.",
    "Be critical where the evidence is weak. Prefer concrete, verifiable feedback.",
    "When relevant, use the student's saved activities to suggest stronger specificity, credibility, and evidence in revisions.",
    "Do not fabricate activity facts. Only reference activities explicitly provided in context.",
    "You must return ONLY valid JSON matching the required schema.",
    "Do not include any markdown, code fences, or commentary outside the JSON.",
  ].join("\n");

  const user = [
    `Essay type: ${essayType}`,
    ...(essayType === "supplemental_essay" && supplementalContext
      ? [
          `University: ${supplementalContext.universityName}`,
          `Supplement Prompt (${supplementalContext.cycleYear}): ${supplementalContext.promptQuestion}`,
        ]
      : []),
    ...(activitiesContext
      ? [
          "",
          "Student saved activities context (use only when relevant):",
          activitiesContext,
        ]
      : []),
    "",
    "Rubric dimensions (score each 0-10 with 1-3 sentence justification):",
    ...rubricDimensions.map((d) => `- ${d}`),
    "",
    "Return JSON with the exact keys and structure below:",
    REQUIRED_JSON_SHAPE,
    "",
    "Hard constraints:",
    "- rubric_scores must include exactly all dimensions listed above, each exactly once.",
    "- strengths and weaknesses arrays must have exactly 3 strings each.",
    "- paragraph_feedback must include at least 1 paragraph_number and must be valid.",
    "- sentence_level_edits must include at least 1 edit with original text.",
    "- revision_plan must include at least 1 item.",
    "",
    "Essay text:",
    essayText,
  ].join("\n");

  return { system, user };
}

