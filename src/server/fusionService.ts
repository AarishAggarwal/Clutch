import { rubricDimensions, type ModelEvaluationJson } from "@/lib/evaluationSchema";
import type { FusedEvaluationMode, ModelProvider } from "@/lib/types";

export type FusionDisagreementFlag = {
  dimension: (typeof rubricDimensions)[number];
  openaiScore?: number;
  claudeScore?: number;
  diff: number;
  rule:
    | "weighted_average"
    | "bias_lower_critical_small_diff"
    | "strong_disagreement_use_lower"
    | "single_model";
  note: string;
};

function roundTo(n: number, decimals = 1) {
  const m = Math.pow(10, decimals);
  return Math.round(n * m) / m;
}

function normalizeKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function chooseLowerCritical(a: ModelEvaluationJson, b: ModelEvaluationJson) {
  return a.overall_score <= b.overall_score ? a : b;
}

function combineCloseReasons(reasonA: string, reasonB: string) {
  const a = reasonA.trim();
  const b = reasonB.trim();
  if (a === b) return a;
  // Prefer the more specific/justified reason (heuristic: longer, but still short).
  return a.length >= b.length ? a : b;
}

export function fuseEvaluations(params: {
  openai?: ModelEvaluationJson;
  claude?: ModelEvaluationJson;
}): {
  mode: FusedEvaluationMode;
  fusedJson: ModelEvaluationJson;
  agreementSummary: string;
  disagreementFlags: FusionDisagreementFlag[];
} {
  const hasOpenAI = Boolean(params.openai);
  const hasClaude = Boolean(params.claude);

  if (hasOpenAI && !hasClaude) {
    const fusedJson = params.openai as ModelEvaluationJson;
    return {
      mode: "single-model",
      fusedJson,
      agreementSummary: "Only OpenAI evaluation was available, so this fused review mirrors that output directly.",
      disagreementFlags: [],
    };
  }

  if (!hasOpenAI && hasClaude) {
    const fusedJson = params.claude as ModelEvaluationJson;
    return {
      mode: "single-model",
      fusedJson,
      agreementSummary: "Only Claude evaluation was available, so this fused review mirrors that output directly.",
      disagreementFlags: [],
    };
  }

  const openai = params.openai as ModelEvaluationJson;
  const claude = params.claude as ModelEvaluationJson;
  const lowerCritical = chooseLowerCritical(openai, claude);
  const higherOptimistic = lowerCritical === openai ? claude : openai;

  const fusedRubric = rubricDimensions.map((dimension) => {
    const a = openai.rubric_scores.find((s) => s.dimension === dimension)!;
    const b = claude.rubric_scores.find((s) => s.dimension === dimension)!;
    const diff = Math.abs(a.score - b.score);

    if (diff <= 1.5) {
      const blended = roundTo((a.score + b.score) / 2, 1);
      return {
        dimension,
        score: blended,
        reason: combineCloseReasons(a.reason, b.reason),
      };
    }

    if (diff <= 3) {
      const lower = a.score <= b.score ? a : b;
      const rule: FusionDisagreementFlag["rule"] = "bias_lower_critical_small_diff";
      return {
        dimension,
        score: lower.score,
        reason: `${lower.reason} The other model is more optimistic here, but the more critical reading better explains what to fix.`,
      };
    }

    const lower = a.score <= b.score ? a : b;
    return {
      dimension,
      score: lower.score,
      reason: `${lower.reason} This is a meaningful disagreement; the fused review leans on the more critical score to protect editorial fairness.`,
    };
  });

  const overallDiff = Math.abs(openai.overall_score - claude.overall_score);
  let fusedOverall = 0;
  if (overallDiff <= 1.5) fusedOverall = Math.round((openai.overall_score + claude.overall_score) / 2);
  else fusedOverall = Math.min(openai.overall_score, claude.overall_score);

  const overlappingStrengths = openai.strengths
    .map((s) => normalizeKey(s))
    .filter((s) => params.claude!.strengths.map((x) => normalizeKey(x)).includes(s));

  const strengths: string[] = [];
  for (const s of openai.strengths) {
    if (strengths.length >= 3) break;
    if (overlappingStrengths.includes(normalizeKey(s))) strengths.push(s);
  }
  if (strengths.length < 3) {
    for (const s of higherOptimistic.strengths) {
      if (strengths.length >= 3) break;
      if (!strengths.map(normalizeKey).includes(normalizeKey(s))) strengths.push(s);
    }
  }

  const criticalWeaknesses = lowerCritical.weaknesses;
  const harsherKeywords = ["unclear", "clich", "generic", "blur", "summary", "weak", "detour", "blunted", "underdrawn"];
  const extraFromOther = higherOptimistic.weaknesses.filter((w) => {
    const k = normalizeKey(w);
    return harsherKeywords.some((kw) => k.includes(kw));
  });
  const weaknessSet = new Set(criticalWeaknesses.map(normalizeKey));
  const weaknesses = [...criticalWeaknesses];
  for (const w of extraFromOther) {
    if (weaknesses.length >= 3) break;
    const nk = normalizeKey(w);
    if (!weaknessSet.has(nk)) {
      weaknesses.push(w);
      weaknessSet.add(nk);
    }
  }

  const paragraphFeedbackByNum = new Map<number, ModelEvaluationJson["paragraph_feedback"][number]>();
  const allParagraphNums = new Set<number>([
    ...openai.paragraph_feedback.map((p) => p.paragraph_number),
    ...claude.paragraph_feedback.map((p) => p.paragraph_number),
  ]);
  allParagraphNums.forEach((pn) => {
    const a = openai.paragraph_feedback.find((p) => p.paragraph_number === pn);
    const b = claude.paragraph_feedback.find((p) => p.paragraph_number === pn);
    paragraphFeedbackByNum.set(pn, (lowerCritical === openai ? a ?? b : b ?? a)!);
  });

  const fusedParagraphFeedback = Array.from(paragraphFeedbackByNum.values()).sort(
    (x, y) => x.paragraph_number - y.paragraph_number,
  );

  // Merge sentence edits (dedup by original).
  const editCandidates = [...openai.sentence_level_edits, ...claude.sentence_level_edits];
  const editMap = new Map<string, ModelEvaluationJson["sentence_level_edits"][number]>();
  for (const e of editCandidates) {
    const key = normalizeKey(e.original);
    const existing = editMap.get(key);
    if (!existing) {
      editMap.set(key, e);
      continue;
    }
    // Prefer whichever comes from the lower-critical evaluation.
    if (lowerCritical === openai) {
      // Keep the one that matches openai.
      const choose = openai.sentence_level_edits.some((x) => normalizeKey(x.original) === key) ? e : existing;
      editMap.set(key, choose);
    } else {
      const choose = claude.sentence_level_edits.some((x) => normalizeKey(x.original) === key) ? e : existing;
      editMap.set(key, choose);
    }
  }

  const sentenceLevelEdits = Array.from(editMap.values()).slice(0, 8);

  // Deduplicate and rank revision plan by keywords/dimension priorities.
  const revisionPlanDedup = new Map<string, string>();
  for (const s of [...openai.revision_plan, ...claude.revision_plan]) {
    const key = normalizeKey(s);
    if (!revisionPlanDedup.has(key)) revisionPlanDedup.set(key, s);
  }
  const dimPriority = fusedRubric
    .slice()
    .sort((a, b) => a.score - b.score)
    .map((x) => x.dimension);

  function revisionImpactScore(plan: string) {
    const p = normalizeKey(plan);
    let score = 0;
    const keywordWeights: Record<string, number> = {
      authenticity: 8,
      specificity: 8,
      clarity: 7,
      reflection: 7,
      structure: 6,
      "narrative_arc": 6,
      memorability: 5,
      "cliche_risk": 6,
      impact: 5,
    };
    for (const k of Object.keys(keywordWeights)) {
      if (p.includes(normalizeKey(k))) score += keywordWeights[k];
    }
    if (p.includes("rewrite") || p.includes("replace")) score += 4;
    if (p.includes("add") || p.includes("include")) score += 2;
    return score;
  }

  const revisionPlan = Array.from(revisionPlanDedup.values())
    .sort((a, b) => revisionImpactScore(b) - revisionImpactScore(a))
    .slice(0, 5);

  const rubricLowestTwo = fusedRubric.slice().sort((a, b) => a.score - b.score).slice(0, 2);
  const weakestDims = rubricLowestTwo.map((d) => d.dimension).join(" and ");
  const agreementSummary = [
    overallDiff <= 3
      ? "Both models broadly agree on the essay’s main strengths and main fixes."
      : "The models disagree in several specific places; the fused review prioritizes the more critical, admissions-focused reading.",
    `Most of the fused attention falls on: ${weakestDims}.`,
  ].join(" ");

  const disagreementFlags: FusionDisagreementFlag[] = [];
  for (const dimension of rubricDimensions) {
    const a = openai.rubric_scores.find((s) => s.dimension === dimension)!;
    const b = claude.rubric_scores.find((s) => s.dimension === dimension)!;
    const diff = Math.abs(a.score - b.score);
    if (diff <= 1.5) continue;
    if (diff <= 3) {
      disagreementFlags.push({
        dimension,
        openaiScore: a.score,
        claudeScore: b.score,
        diff,
        rule: "bias_lower_critical_small_diff",
        note: "Scores are meaningfully apart but not extreme; the fused version leans to the more critical score.",
      });
    } else {
      disagreementFlags.push({
        dimension,
        openaiScore: a.score,
        claudeScore: b.score,
        diff,
        rule: "strong_disagreement_use_lower",
        note: "Strong disagreement; the fused version uses the more critical score to avoid overestimating the draft.",
      });
    }
  }

  const finalVerdict =
    fusedOverall < 60
      ? `Elite reader verdict: this draft shows promise, but it currently under-delivers on the specific areas that make essays persuasive. Focus your next revision on ${weakestDims}, then rebuild the reflection turn so it reads like real growth rather than summary.`
      : fusedOverall < 75
        ? `Elite reader verdict: this essay is coherent and has a credible core, but it needs sharper execution to feel admissions-ready. Improve ${weakestDims}, make causality more explicit, and ensure the ending lands on a concrete “so what” tied to your next step.`
        : `Elite reader verdict: the essay is close—its voice and intent come through. The remaining gap is precision and landing: tighten ${weakestDims} so the reader feels a clear before/after and a memorable decision-driven ending.`;

  const fusedJson: ModelEvaluationJson = {
    overall_score: fusedOverall,
    essay_summary: `${lowerCritical.essay_summary} The fused review preserves the overlap, but treats the more critical diagnosis as the revision priority.`,
    rubric_scores: fusedRubric as any,
    strengths: strengths as any,
    weaknesses: weaknesses as any,
    paragraph_feedback: fusedParagraphFeedback as any,
    sentence_level_edits: sentenceLevelEdits as any,
    revision_plan: revisionPlan as any,
    final_verdict: finalVerdict,
  };

  return {
    mode: (disagreementFlags.length > 0 ? "dual-model" : "dual-model") as FusedEvaluationMode,
    fusedJson,
    agreementSummary,
    disagreementFlags,
  };
}

