import { evaluateEssayWithOpenAI } from "@/server/openaiService";
import { evaluateEssayWithClaude } from "@/server/anthropicService";
import { fuseEvaluations } from "@/server/fusionService";
import { modelEvaluationJsonSchema } from "@/lib/evaluationSchema";
import type { EssayType, FusedEvaluationMode } from "@/lib/types";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";

export async function evaluateEssayWithProviders(params: {
  essayType: EssayType;
  essayText: string;
  supplementalContext?: {
    universityName: string;
    promptQuestion: string;
    cycleYear: string;
  };
  activitiesContext?: string;
}): Promise<{
  mode: FusedEvaluationMode;
  fusedJson: ModelEvaluationJson;
  agreementSummary: string;
  disagreementFlags: unknown;
  openaiResult?: {
    provider: "groq";
    modelName: string;
    rawJson: unknown;
    parsedJson: ModelEvaluationJson;
  };
  claudeResult?: {
    provider: "gemini";
    modelName: string;
    rawJson: unknown;
    parsedJson: ModelEvaluationJson;
  };
}> {
  const openaiKey = process.env.GROQ_API_KEY;
  const claudeKey = process.env.GEMINI_API_KEY;

  const haveOpenAI = Boolean(openaiKey && openaiKey.trim().length > 0);
  const haveClaude = Boolean(claudeKey && claudeKey.trim().length > 0);

  const runOpenAI = haveOpenAI;
  const runClaude = haveClaude;

  let openaiResult:
    | {
        provider: "groq";
        modelName: string;
        rawJson: unknown;
        parsedJson: ModelEvaluationJson;
      }
    | undefined;
  let claudeResult:
    | {
        provider: "gemini";
        modelName: string;
        rawJson: unknown;
        parsedJson: ModelEvaluationJson;
      }
    | undefined;

  let openaiError: string | undefined;
  let claudeError: string | undefined;

  if (runOpenAI) {
    try {
      const res = await evaluateEssayWithOpenAI({
        essayType: params.essayType,
        essayText: params.essayText,
        supplementalContext: params.supplementalContext,
        activitiesContext: params.activitiesContext,
      });
      // Validate to enforce strict JSON output shape for later Phase 2 provider integration.
      const parsedJson = modelEvaluationJsonSchema.parse(res.parsedJson);
      openaiResult = { ...res, parsedJson };
    } catch (err) {
      openaiResult = undefined;
      openaiError = String((err as any)?.message ?? err);
    }
  }

  if (runClaude) {
    try {
      const res = await evaluateEssayWithClaude({
        essayType: params.essayType,
        essayText: params.essayText,
        supplementalContext: params.supplementalContext,
        activitiesContext: params.activitiesContext,
      });
      const parsedJson = modelEvaluationJsonSchema.parse(res.parsedJson);
      claudeResult = { ...res, parsedJson };
    } catch (err) {
      claudeResult = undefined;
      claudeError = String((err as any)?.message ?? err);
    }
  }

  if (!openaiResult && !claudeResult) {
    throw new Error(
      `No provider could produce a valid evaluation result. Groq error: ${openaiError ?? "unknown"}. Gemini error: ${claudeError ?? "unknown"}.`,
    );
  }

  const { mode, fusedJson, agreementSummary, disagreementFlags } = fuseEvaluations({
    openai: openaiResult?.parsedJson,
    claude: claudeResult?.parsedJson,
  });

  return {
    mode,
    fusedJson,
    agreementSummary,
    disagreementFlags,
    openaiResult,
    claudeResult,
  };
}

