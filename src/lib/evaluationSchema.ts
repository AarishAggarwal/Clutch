import { z } from "zod";

export const rubricDimensions = [
  "authenticity",
  "specificity",
  "clarity",
  "reflection",
  "structure",
  "narrative_arc",
  "memorability",
  "cliche_risk",
  "overall_impact",
] as const;

export type RubricDimension = (typeof rubricDimensions)[number];

const rubricScoreSchema = z.object({
  dimension: z.enum(rubricDimensions),
  score: z.number().min(0).max(10),
  reason: z.string().min(1).max(1200),
});

export const modelEvaluationJsonSchema = z.object({
  overall_score: z.number().min(0).max(100),
  essay_summary: z.string().min(1).max(4000),
  rubric_scores: z
    .array(rubricScoreSchema)
    .length(rubricDimensions.length)
    .refine(
      (scores) => new Set(scores.map((s) => s.dimension)).size === rubricDimensions.length,
      "rubric_scores must include each rubric dimension exactly once",
    ),
  strengths: z.array(z.string().min(1).max(1200)).length(3),
  weaknesses: z.array(z.string().min(1).max(1200)).length(3),
  paragraph_feedback: z
    .array(
      z.object({
        paragraph_number: z.number().int().min(1),
        feedback: z.string().min(1).max(2000),
      }),
    )
    .min(1),
  sentence_level_edits: z
    .array(
      z.object({
        original: z.string().min(1).max(5000),
        suggestion: z.string().min(1).max(5000),
        reason: z.string().min(1).max(2000),
      }),
    )
    .min(1),
  revision_plan: z.array(z.string().min(1).max(2000)).min(1),
  final_verdict: z.string().min(1).max(5000),
});

export type ModelEvaluationJson = z.infer<typeof modelEvaluationJsonSchema>;

