import { z } from "zod";
import { essayTypes, type EssayType } from "@/lib/types";

export const essayTypeSchema = z.enum(essayTypes.map((t) => t.id) as [EssayType, ...EssayType[]]);

export const evaluateEssayRequestSchema = z.object({
  essayType: essayTypeSchema,
  title: z.string().min(1).max(200).optional(),
  supplementalUniversityId: z.string().min(1).max(100).optional(),
  supplementalUniversityName: z.string().min(1).max(200).optional(),
  supplementalPromptId: z.string().min(1).max(120).optional(),
  supplementalPromptQuestion: z.string().min(1).max(500).optional(),
  supplementalPromptCycleYear: z.string().min(1).max(20).optional(),
  content: z.string().min(1).max(20000),
}).superRefine((data, ctx) => {
  if (data.essayType !== "supplemental_essay") return;
  if (!data.supplementalUniversityId || !data.supplementalUniversityName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "University is required for supplemental essays." });
  }
  if (!data.supplementalPromptId || !data.supplementalPromptQuestion || !data.supplementalPromptCycleYear) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Prompt selection is required for supplemental essays." });
  }
});

export type EvaluateEssayRequest = z.infer<typeof evaluateEssayRequestSchema>;

