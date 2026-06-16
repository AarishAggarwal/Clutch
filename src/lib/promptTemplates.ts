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
  /** Admitted-student essay corpus: in-context calibration (not model fine-tuning). */
  referenceCorpus?: string;
}) {
  const { essayType, essayText, supplementalContext, activitiesContext, referenceCorpus } = params;

  const system = [
    "You are an elite, critical college admissions reviewer.",
    "You must be fair, analytical, and specific. Avoid generic praise.",
    "Be critical where the evidence is weak. Prefer concrete, verifiable feedback.",
    "When relevant, use the student's saved activities to suggest stronger specificity, credibility, and evidence in revisions.",
    "Do not fabricate activity facts. Only reference activities explicitly provided in context.",
    ...(referenceCorpus
      ? [
          "A reference corpus of essays that resulted in admission is included below. Use it only as a qualitative bar for structure, voice, specificity, and depth—never to copy topics or phrasing.",
          "Compare the draft under review to these exemplars when judging rubric dimensions; acknowledge when the draft meets or falls short of that bar.",
          "Do not paste long excerpts from the reference corpus inside your JSON output; describe patterns and gaps in your own words.",
        ]
      : []),
    "You must return ONLY valid JSON matching the required schema.",
    "Do not include any markdown, code fences, or commentary outside the JSON.",
    "Use plain professional text only. Do not use asterisks, pipes, markdown headers, or tables.",
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
    ...(referenceCorpus
      ? [
          "",
          "### Reference corpus (admitted-student essays — calibration set)",
          "These samples are from successful applications. Treat them as a benchmark for what strong execution can look like, alongside general admissions standards—not as the only valid style or content.",
          "",
          referenceCorpus,
          "",
          "---",
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

