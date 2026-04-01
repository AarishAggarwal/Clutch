import type { SupplementalPrompt, SupplementalUniversity } from "@/lib/types";
import { SUPPLEMENTAL_CYCLE_YEAR } from "@/lib/supplemental/cycle";

type PromptDef = {
  id: string;
  question: string;
  wordLimit?: string;
  kind?: SupplementalPrompt["kind"];
};

export function uni(
  slug: string,
  name: string,
  submissionDeadlines: string | undefined,
  prompts: PromptDef[],
): SupplementalUniversity {
  return {
    id: slug,
    slug,
    name,
    submissionDeadlines,
    prompts: prompts.map((p) => ({
      id: p.id,
      cycleYear: SUPPLEMENTAL_CYCLE_YEAR,
      question: p.question,
      wordLimit: p.wordLimit,
      kind: p.kind,
    })),
  };
}
