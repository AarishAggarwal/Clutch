import type { EssayType, FusedEvaluationMode } from "@/lib/types";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import { rubricDimensions } from "@/lib/evaluationSchema";

export type MockConversationListItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
};

const demoFusedJson: ModelEvaluationJson = {
  overall_score: 72,
  essay_summary:
    "This draft shows genuine voice and intent, but the scene-level specificity and reflection turn need sharper execution to feel admissions-ready.",
  rubric_scores: [
    { dimension: "authenticity", score: 7, reason: "Your voice is credible and mostly consistent, though one or two passages read like a step-by-step summary." },
    { dimension: "specificity", score: 5, reason: "You reference the right themes but don’t anchor them with enough concrete artifacts, places, or measurable moments." },
    { dimension: "clarity", score: 6, reason: "The argument is understandable, but some causal links get buried in dense phrasing." },
    { dimension: "reflection", score: 6, reason: "Growth is present, yet the turning point (what you revised in your thinking) is not fully visible." },
    { dimension: "structure", score: 7, reason: "Paragraphing supports the narrative spine; transitions can still explain why each scene matters." },
    { dimension: "narrative_arc", score: 6, reason: "There is momentum, but the before/after transformation reads a bit underdrawn." },
    { dimension: "memorability", score: 6, reason: "A few moments could stick, but the strongest details need to be sharpened into vivid images." },
    { dimension: "cliche_risk", score: 8, reason: "You avoid many common clichés, though a couple of lines still feel polished in a generic way." },
    { dimension: "overall_impact", score: 7, reason: "Overall, the draft holds together and communicates intent. Precision would elevate it further." },
  ],
  strengths: [
    "A credible personal voice with consistent stakes",
    "Paragraphing that supports the story spine",
    "A generally clear sense of what changed over time",
  ],
  weaknesses: [
    "Specificity is limited: add more concrete artifacts and decision-linked details",
    "Reflection needs a visible thinking shift, not just a summary of growth",
    "Tighten dense phrasing so causality and the main claim land immediately",
  ],
  paragraph_feedback: [
    { paragraph_number: 1, feedback: "Move sooner into the lived moment. Consider starting with the first decision point rather than the topic framing." },
    { paragraph_number: 2, feedback: "Good material here; make the choice-and-consequence chain explicit. What did you do, and what changed afterward?" },
    { paragraph_number: 3, feedback: "Give the ending a concrete “so what.” If you mention an aspiration, tie it to a specific next step you would take." },
  ],
  sentence_level_edits: [
    {
      original: "I realized that I could make a difference through perseverance.",
      suggestion: "When I saw the results for the first time, I chose to revise my plan instead of restarting—then I saw a measurable improvement within two weeks.",
      reason: "Admissions readers trust reflection when it is anchored to a specific moment and a concrete change.",
    },
    {
      original: "However, I learned a lot about teamwork and growth.",
      suggestion: "After the conflict, we rewrote responsibilities and agreed on a new feedback loop—our next meeting ran smoother and faster.",
      reason: "Clarifies causality and strengthens both structure and reflection with concrete evidence.",
    },
  ],
  revision_plan: [
    "Rewrite the opening to start in-scene with a decision point within the first 2-3 sentences.",
    "Add 3-5 concrete specifics (numbers, places, artifacts, dialogue) tied to choices you made.",
    "Strengthen the reflection turn by showing what you revised in your thinking (uncertainty -> revision -> next action).",
  ],
  final_verdict:
    "Elite reader verdict: the voice is real and the draft is readable, but it currently under-delivers on the precision that makes essays persuasive. Sharpen specificity and make the reflection shift unmistakable, and this will feel admissions-ready.",
};

const demoOpenAI: ModelEvaluationJson = {
  ...demoFusedJson,
  overall_score: 75,
  essay_summary:
    "The essay communicates authentic intent and a credible growth arc. The main opportunities are specificity (more tangible moments) and a clearer reflection turn that shows what changed in your thinking.",
};

const demoClaude: ModelEvaluationJson = {
  ...demoFusedJson,
  overall_score: 68,
  essay_summary:
    "The narrative has strong potential, but several passages read more like summary than a lived scene. The fastest improvement is to replace generic reflection language with one concrete turning point and its consequence.",
};

export const mockConversations: MockConversationListItem[] = [
  {
    id: "mock-conv-1",
    title: "Common App: Personal Statement",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessagePreview: "Elite reader verdict: the essay is close—its voice and intent come through…",
  },
];

export function getMockConversationMessages(conversationId: string) {
  if (conversationId !== "mock-conv-1") return [];

  const assistantMeta = {
    mode: "dual-model" as FusedEvaluationMode,
    content:
      "Hi. Paste your college essay and tell me which prompt it’s for. I’ll evaluate it with two independent reviewers and fuse the feedback into a single fair admissions-ready review.",
  };

  const fusedPayload = {
    mode: "dual-model" as FusedEvaluationMode,
    fusedJson: demoFusedJson,
    agreementSummary: "Both models broadly agree on the draft’s core strengths and the biggest revision focus.",
    disagreementFlags: [
      {
        dimension: "specificity",
        openaiScore: demoOpenAI.rubric_scores.find((s) => s.dimension === "specificity")?.score,
        claudeScore: demoClaude.rubric_scores.find((s) => s.dimension === "specificity")?.score,
        diff: 2.0,
        rule: "bias_lower_critical_small_diff",
        note: "Scores differ moderately; the fused review leans into the more critical diagnosis to guide revision priorities.",
      },
    ],
    openaiResult: { modelName: "openai-mock", parsedJson: demoOpenAI, rawJson: demoOpenAI },
    claudeResult: { modelName: "claude-mock", parsedJson: demoClaude, rawJson: demoClaude },
  };

  return [
    {
      id: "m1",
      role: "assistant",
      messageType: "meta" as const,
      content: assistantMeta.content,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: "m2",
      role: "user",
      messageType: "essay_submission" as const,
      content:
        "In the first week of junior year, I tried to lead a club meeting with a plan I’d practiced in my head. When the conversation stalled, I realized my assumptions didn’t match the room. I rewrote the agenda, listened to what students actually cared about, and by the second meeting the energy shifted. I learned that teamwork isn’t agreement on paper; it is responsiveness in the moment.\n\nWhen conflict resurfaced later, I didn’t double down on my original idea. I asked for feedback, adjusted responsibilities, and we built a new rhythm. Over time, I became more precise about decisions—what I do, why I do it, and what changes because of it.",
      createdAt: new Date(Date.now() - 40000).toISOString(),
    },
    {
      id: "m3",
      role: "assistant",
      messageType: "fused_result" as const,
      content: JSON.stringify(fusedPayload),
      createdAt: new Date(Date.now() - 20000).toISOString(),
    },
  ];
}

