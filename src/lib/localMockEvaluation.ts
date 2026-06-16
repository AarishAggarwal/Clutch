import type { EssayType } from "@/lib/types";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import { generateMockModelEvaluation } from "@/server/mockModelEvaluator";
import { fuseEvaluations } from "@/server/fusionService";

export function runLocalMockEvaluation(params: {
  essayType: EssayType;
  essayText: string;
}) {
  const openai: ModelEvaluationJson = generateMockModelEvaluation({
    provider: "groq",
    essayType: params.essayType,
    essayText: params.essayText,
  });

  const claude: ModelEvaluationJson = generateMockModelEvaluation({
    provider: "gemini",
    essayType: params.essayType,
    essayText: params.essayText,
  });

  const fused = fuseEvaluations({ openai, claude });

  return {
    mode: fused.mode,
    fusedJson: fused.fusedJson,
    agreementSummary: fused.agreementSummary,
    disagreementFlags: fused.disagreementFlags,
    openaiResult: {
      modelName: "groq-mock",
      parsedJson: openai,
      rawJson: openai,
    },
    claudeResult: {
      modelName: "gemini-mock",
      parsedJson: claude,
      rawJson: claude,
    },
  };
}

