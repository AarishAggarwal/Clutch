import type { EssayType } from "@/lib/types";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import { generateMockModelEvaluation } from "@/server/mockModelEvaluator";
import { fuseEvaluations } from "@/server/fusionService";

export function runLocalMockEvaluation(params: {
  essayType: EssayType;
  essayText: string;
}) {
  const openai: ModelEvaluationJson = generateMockModelEvaluation({
    provider: "openai",
    essayType: params.essayType,
    essayText: params.essayText,
  });

  const claude: ModelEvaluationJson = generateMockModelEvaluation({
    provider: "claude",
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
      modelName: "openai-mock",
      parsedJson: openai,
      rawJson: openai,
    },
    claudeResult: {
      modelName: "claude-mock",
      parsedJson: claude,
      rawJson: claude,
    },
  };
}

