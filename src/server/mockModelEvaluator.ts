import { modelEvaluationJsonSchema, type ModelEvaluationJson } from "@/lib/evaluationSchema";
import { rubricDimensions } from "@/lib/evaluationSchema";
import type { EssayType, ModelProvider } from "@/lib/types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function normalizeWhitespace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function getParagraphs(essayText: string) {
  const parts = essayText
    .split(/\n\s*\n/g)
    .map((p) => normalizeWhitespace(p))
    .filter(Boolean);
  return parts.length ? parts : [normalizeWhitespace(essayText)];
}

function splitSentences(essayText: string) {
  const normalized = essayText.replace(/\n/g, " ");
  const raw = normalized
    .split(/(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return raw.length ? raw : normalized ? [normalized] : [];
}

const clicheKeywords = [
  "journey",
  "passion",
  "grateful",
  "dream",
  "underdog",
  "heart",
  "learned",
  "forever",
  "impossible",
  "never give up",
  "out of the box",
  "world-changing",
];

function countMatches(haystack: string, needles: string[]) {
  const lower = haystack.toLowerCase();
  let count = 0;
  for (const n of needles) {
    if (lower.includes(n)) count += 1;
  }
  return count;
}

export function generateMockModelEvaluation(params: {
  provider: ModelProvider;
  essayType: EssayType;
  essayText: string;
}): ModelEvaluationJson {
  const { provider, essayText, essayType } = params;
  const essay = essayText.trim();

  const paragraphTexts = getParagraphs(essay);
  const sentences = splitSentences(essay);
  const words = essay.split(/\s+/g).filter(Boolean);

  const firstPersonCount = (essay.match(/\b(I|I'M|I'VE|my|mine|we|our|me|myself)\b/gi) || []).length;
  const numericCount = (essay.match(/\b\d+([.,]\d+)?\b/g) || []).length;
  const capitalizedCount = (essay.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []).length;
  const clicheCount = countMatches(essay, clicheKeywords);

  const avgSentenceLen = sentences.length
    ? words.length / Math.max(1, sentences.length)
    : words.length;

  const reflectionSignals = (essay.match(/\b(learned|realized|changed|reflection|reflection:|growth|shifted|before|after)\b/gi) || [])
    .length;
  const structureSignals = (essay.match(/\b(though|however|because|therefore|as a result|finally|in the end|first|then|next)\b/gi) || [])
    .length;

  const vividSignals = (essay.match(/\b(spark|ignite|intense|sharp|quiet|sudden|specific|concrete|measured|real|tangible)\b/gi) || []).length;

  // Provider offset: mock "Claude" is slightly more critical than mock "OpenAI".
  const providerDelta = provider === "claude" ? -0.8 : +0.6;

  const authenticity = clamp(4 + firstPersonCount * 0.6 - clicheCount * 0.9 + providerDelta, 0, 10);
  const specificity = clamp(2.5 + numericCount * 1.1 + capitalizedCount * 0.08 + vividSignals * 0.25, 0, 10);
  const clarity = clamp(5.2 + (avgSentenceLen < 26 ? 1.0 : -0.8) + (structureSignals > 3 ? 0.8 : -0.2) + providerDelta * 0.25, 0, 10);
  const reflection = clamp(3.5 + reflectionSignals * 0.9 + (clicheCount === 0 ? 0.5 : -0.2) + providerDelta * 0.2, 0, 10);
  const structure = clamp(4.5 + structureSignals * 0.6 + (paragraphTexts.length >= 2 ? 0.7 : -0.6) + providerDelta * 0.3, 0, 10);
  const narrative_arc = clamp(3.8 + (essay.includes("when") || essay.includes("then") ? 1.2 : 0) + (essay.includes("because") ? 0.6 : 0) + providerDelta * 0.25, 0, 10);
  const memorability = clamp(3.6 + vividSignals * 0.7 + (specificity > 6 ? 0.6 : -0.2) + providerDelta * 0.25, 0, 10);
  const cliche_risk = clamp(10 - (clicheCount * 2.0 + reflectionSignals * 0.3 + (firstPersonCount > 6 ? 0.3 : 0)), 0, 10);
  const overall_impact = clamp(
    0.15 * authenticity +
      0.18 * reflection +
      0.12 * clarity +
      0.12 * structure +
      0.1 * narrative_arc +
      0.1 * specificity +
      0.09 * memorability +
      0.04 * (10 - cliche_risk) +
      providerDelta * 0.2,
    0,
    10,
  );

  const dimensionToScore = {
    authenticity,
    specificity,
    clarity,
    reflection,
    structure,
    narrative_arc,
    memorability,
    cliche_risk,
    overall_impact,
  };

  const rubric_scores = rubricDimensions.map((dimension) => ({
    dimension,
    score: round1(dimensionToScore[dimension]),
    reason:
      dimension === "cliche_risk"
        ? clicheCount > 1
          ? "The language leans on familiar motivational phrasing, which weakens originality. Replace at least a few cliché turns with concrete moments and specific observations."
          : "The essay avoids many common cliché beats and keeps the focus on lived experience. A few phrases still feel polished—tighten them to stay vivid and personal."
        : dimension === "authenticity"
          ? firstPersonCount < 4
            ? "The voice feels somewhat distant from the author, so it is harder to trust the stakes. Add one or two sentences that show what you felt or risked in real time."
            : authenticity < 6
              ? "The essay sounds reflective, but some statements read like summary rather than lived scene. Trade general interpretations for a sharper anecdote or dialogue moment."
              : "The voice comes through clearly, and the choices feel consistent with your identity. The strongest parts read like you, not a template."
          : dimension === "specificity"
            ? numericCount === 0
              ? "Specificity is limited: there are few concrete details (numbers, places, artifacts) to anchor the reader. Add two or three tangible specifics that change how the story feels."
              : "You include some measurable details that make the story believable. Push further by tying each number to a decision you made, not just a fact."
            : dimension === "clarity"
              ? avgSentenceLen > 30
                ? "Several sentences run long, which blurs causality and makes your main point harder to follow. Break up the densest sentences and lead with the claim."
                : "The essay is readable and generally well-paced. A few transitions could be more explicit about why each event matters."
              : dimension === "reflection"
                ? reflectionSignals < 2
                  ? "Reflection is present, but it tends to summarize what you learned rather than show how your thinking changed. Make the turning point more visible by describing a moment of uncertainty or revision."
                  : "Your reflection is thoughtful and connects events to personal growth. For extra strength, clarify the link between your insight and your next actions."
                : dimension === "structure"
                  ? paragraphTexts.length < 2
                    ? "The structure feels like one continuous block, which blunts emotional pacing. Introduce paragraph breaks that correspond to scene shifts and turning points."
                    : structure < 6
                      ? "The essay has recognizable movement, but the reader occasionally loses the spine of your argument. Tighten transitions so the ‘why’ is obvious after each paragraph."
                      : "Structure supports the story: the reader can track scenes and consequences. Keep paragraph openings purposeful and minimize detours."
                  : dimension === "narrative_arc"
                    ? narrative_arc < 5.5
                      ? "The arc moves forward, but the beginning-to-middle-to-end transformation is underdrawn. Add a clear before/after contrast in the final movement."
                      : "The narrative arc has momentum and a believable progression. Ensure the ending lands on a specific decision, not just a generalized aspiration."
                    : dimension === "memorability"
                      ? memorability < 5.5
                        ? "Nothing fully sticks after reading, because the most vivid moments are either brief or not sharpened. Choose one scene and make the sensory details more concrete."
                        : "There are moments that feel distinctive and could be memorable to an evaluator. Strengthen them with one or two extra concrete images."
                      : dimension === "overall_impact"
                        ? overall_impact < 6
                          ? "Overall, the essay communicates potential, but key arguments remain too general. The biggest gains come from sharpening authenticity, specificity, and the reflection turn."
                          : "Overall impact is strong: the story holds together and the reader can see why it matters. With a bit more precision, it could feel truly ‘admissions-ready.’"
                        : "Your execution is mixed but promising. Tighten the weakest sections and amplify the best scene."
  }));

  // Build strengths/weaknesses arrays from rubric.
  const sortedDims = [...rubricDimensions]
    .map((d) => ({ d, s: dimensionToScore[d] }))
    .sort((a, b) => b.s - a.s);

  const weakest = [...sortedDims].reverse();

  const strengths = [
    sortedDims[0].d === "authenticity"
      ? "A consistent, credible personal voice"
      : sortedDims[0].d === "reflection"
        ? "Thoughtful reflection that connects events to growth"
        : sortedDims[0].d === "specificity"
          ? "Effective use of concrete details to ground the story"
          : sortedDims[0].d === "clarity"
            ? "Readable pacing and generally clear reasoning"
            : "A coherent execution that generally holds together",
    sortedDims[1].d === "structure"
      ? "Paragraphing and transitions that support the story spine"
      : sortedDims[1].d === "narrative_arc"
        ? "A believable progression from moment to moment"
        : sortedDims[1].d === "memorability"
          ? "Distinctive details that can stick with the reader"
          : "A meaningful thematic throughline",
    sortedDims[2].d === "cliche_risk"
      ? "Language choices that mostly avoid stock clichés"
      : sortedDims[2].d === "overall_impact"
        ? "Strong overall impact for this prompt"
        : "A clear sense of what the essay is trying to prove",
  ].slice(0, 3);

  const weaknesses = [
    weakest[0].d === "cliche_risk"
      ? "Some motivational phrasing feels familiar rather than original"
      : weakest[0].d === "authenticity"
        ? "Parts read like summary instead of a lived moment"
        : weakest[0].d === "specificity"
          ? "Too few tangible details to make the story vivid"
          : weakest[0].d === "reflection"
            ? "Reflection could show the thinking shift more concretely"
            : `A key area that needs sharper execution (${weakest[0].d})`,
    weakest[1].d === "structure"
      ? "Structure needs tighter scene shifts and clearer transitions"
      : weakest[1].d === "clarity"
        ? "Causality and main point get blurred in the densest passages"
        : `Limited development in ${weakest[1].d}`,
    weakest[2].d === "narrative_arc"
      ? "The before/after transformation is underdrawn"
      : weakest[2].d === "memorability"
        ? "The best moment isn’t sharpened enough to stand out"
        : "Opportunities to refine the central argument and landing",
  ].slice(0, 3);

  const paragraph_feedback = paragraphTexts.slice(0, 3).map((p, idx) => ({
    paragraph_number: idx + 1,
    feedback:
      idx === 0
        ? "Your opening establishes context, but it should move sooner into the specific scene (not just the topic). Consider starting with the moment you first faced the challenge."
        : idx === 1
          ? "This paragraph contains useful material. Strengthen it by making the decision points explicit: what you chose, why you chose it, and what changed afterward."
          : "Your ending should land on a clear ‘so what’ tied to future actions. If you make an aspiration, show the concrete next step it leads to.",
  }));

  const edits = sentences.slice(0, 3);
  const sentence_level_edits =
    edits.length >= 1
      ? edits.map((original, idx) => {
          if (!original) return { original: "", suggestion: "", reason: "" };
          const suggestion =
            idx === 0
              ? "Replace the opening with a specific scene: what happened, where, and what you decided in the first 2-3 sentences."
              : idx === 1
                ? "Tighten the main claim: remove one vague sentence and lead with the cause-and-effect (what you did -> what changed)."
                : "Make the reflection concrete by describing a moment of uncertainty and what you revised in your thinking.";
          const reason =
            idx === 0
              ? "Admissions reviewers reward immediacy. A scene-driven opening boosts authenticity and specificity quickly."
              : idx === 1
                ? "Clear causality improves clarity and structure. This reduces reader effort and strengthens your argument."
                : "Specific reflection signals maturity and makes your growth believable rather than generic.";
          return { original, suggestion, reason };
        })
      : [
          {
            original: "Your opening sentence.",
            suggestion: "Start with a specific moment instead of a topic statement.",
            reason: "It increases authenticity and specificity while improving clarity.",
          },
        ];

  const overall_score = Math.round((overall_impact / 10) * 100);

  const revision_plan = [
    "Rewrite the opening to start in-scene (specific moment, setting, and decision) within the first 2-3 sentences.",
    "Add 3-5 concrete specifics (numbers, locations, artifacts, dialogue) and tie each one to a decision you made.",
    "Strengthen the reflection turn by showing what changed in your thinking (uncertainty, revision, and what you do next).",
  ];

  const essay_summary = `This ${essayType.replaceAll("_", " ")} essay communicates personal growth, but it currently reads a bit more like summary than scene. The core ideas are present; the main improvements are tightening authenticity with concrete moments, increasing specificity, and making the reflection shift unmistakable.`;

  const final_verdict =
    overall_score < 60
      ? "This essay has a foundation, but it needs more scene-based authenticity and sharper specificity to earn sustained reader attention. Treat this as a revision project: show the turning point, tighten transitions, and replace familiar phrasing with concrete details."
      : overall_score < 75
        ? "This is a solid, readable draft with genuine intent. To reach ‘elite reviewer’ territory, deepen the concrete moments, make causality and structure unmistakable, and ensure the final reflection turn feels earned—not just summarized."
        : "This draft is close. With careful tightening—especially in specificity, reflection concreteness, and the landing ‘so what’—it could feel unusually persuasive to an admissions reader.";

  const result: ModelEvaluationJson = {
    overall_score,
    essay_summary,
    rubric_scores: rubric_scores as any,
    strengths: strengths as any,
    weaknesses: weaknesses as any,
    paragraph_feedback,
    sentence_level_edits: sentence_level_edits as any,
    revision_plan,
    final_verdict,
  };

  return modelEvaluationJsonSchema.parse(result);
}

