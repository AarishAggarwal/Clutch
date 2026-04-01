import type { EssayType, ChatMessageRole, ChatMessageType, FusedEvaluationMode, ModelProvider } from "@/lib/types";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import { prisma } from "@/server/prisma";

export type ChatMessageRecord = {
  id: string;
  role: ChatMessageRole;
  messageType: ChatMessageType;
  content: string;
  createdAt: Date;
};

export async function createConversation(params?: { title?: string }) {
  const title = params?.title?.trim() ? params.title!.trim() : "New essay review";
  const conversation = await prisma.conversation.create({
    data: { title },
  });

  const systemGreeting =
    "Hi. Paste your college essay and tell me which prompt it’s for (Common App Personal Statement, Supplemental Essay, UC PIQ, or Activity Description). I’ll evaluate it with two independent reviewers and fuse their feedback into a single, fair admissions-ready review.";

  // Create an initial assistant/system message to make the UI feel alive.
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      messageType: "meta",
      content: systemGreeting,
    },
  });

  return { conversationId: conversation.id };
}

export async function createProjectIdeationConversation() {
  const conversation = await prisma.conversation.create({
    data: { title: "Project ideation" },
  });

  const greeting =
    "You’re in the project lab. Describe a problem you care about, a wild idea, or half-baked invention—I’ll help you stretch it into something concrete, unusual, and worth building. What’s on your mind?";

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      messageType: "plain_text",
      content: greeting,
    },
  });

  return { conversationId: conversation.id };
}

export async function appendChatMessage(params: {
  conversationId: string;
  role: ChatMessageRole;
  messageType: ChatMessageType;
  content: string;
}) {
  await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      role: params.role,
      messageType: params.messageType,
      content: params.content,
    },
  });
  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function listConversations() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, messageType: true, role: true },
      },
    },
  });

  return conversations.map((c) => {
    const last = c.messages[0];
    return {
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessagePreview: last?.content?.slice(0, 120) ?? "No messages yet.",
    };
  });
}

export async function getConversationMessages(conversationId: string) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, messageType: true, createdAt: true },
  });

  return messages as unknown as ChatMessageRecord[];
}

export async function saveEssayEvaluation(params: {
  conversationId: string;
  essayType: EssayType;
  essayTitle?: string;
  essayContent: string;
  supplementalUniversityId?: string;
  supplementalUniversityName?: string;
  supplementalPromptId?: string;
  supplementalPromptQuestion?: string;
  supplementalPromptCycleYear?: string;
  computedTitle: string;
  mode: FusedEvaluationMode;
  fusedJson: ModelEvaluationJson;
  agreementSummary: string;
  disagreementFlags: unknown;
  openaiResult?: {
    modelName: string;
    rawJson: unknown;
    parsedJson: ModelEvaluationJson;
  };
  claudeResult?: {
    modelName: string;
    rawJson: unknown;
    parsedJson: ModelEvaluationJson;
  };
}) {
  const title = params.computedTitle;

  // Update conversation title so it’s meaningful in the sidebar.
  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { title },
  });

  const essaySubmission = await prisma.essaySubmission.create({
    data: {
      conversationId: params.conversationId,
      essayType: params.essayType,
      title: params.essayTitle,
      content: params.essayContent,
      supplementalUniversityId: params.supplementalUniversityId,
      supplementalUniversityName: params.supplementalUniversityName,
      supplementalPromptId: params.supplementalPromptId,
      supplementalPromptQuestion: params.supplementalPromptQuestion,
      supplementalPromptCycleYear: params.supplementalPromptCycleYear,
    },
  });

  // Also persist into the Essays workspace for easy recovery/editing outside chat.
  const workspaceTitle = params.computedTitle || params.essayTitle || "Essay Draft";
  const workspaceWordCount = params.essayContent.trim().split(/\s+/).filter(Boolean).length;
  await prisma.essay.create({
    data: {
      title: workspaceTitle,
      essayType: params.essayType,
      content: params.essayContent,
      status: "Reviewed",
      wordCount: workspaceWordCount,
      notes:
        params.essayType === "supplemental_essay" && params.supplementalPromptQuestion
          ? `Prompt (${params.supplementalPromptCycleYear ?? "Latest"}): ${params.supplementalPromptQuestion}`
          : undefined,
      draft: 1,
    },
  });

  // Store the essay as a user message in the chat transcript.
  await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      role: "user",
      messageType: "essay_submission",
      content: params.essayContent,
    },
  });

  const assistantModelMessages: string[] = [];

  if (params.openaiResult) {
    const openaiEval = await prisma.modelEvaluation.create({
      data: {
        essaySubmissionId: essaySubmission.id,
        provider: "openai",
        modelName: params.openaiResult.modelName,
        rawJson: JSON.stringify(params.openaiResult.rawJson),
        parsedJson: JSON.stringify(params.openaiResult.parsedJson),
        validSchema: true,
      },
    });

    assistantModelMessages.push(
      JSON.stringify({
        provider: "openai",
        modelName: openaiEval.modelName,
        validSchema: openaiEval.validSchema,
        parsedJson: openaiEval.parsedJson,
        rawJson: openaiEval.rawJson,
      }),
    );
  }

  if (params.claudeResult) {
    const claudeEval = await prisma.modelEvaluation.create({
      data: {
        essaySubmissionId: essaySubmission.id,
        provider: "deepseek",
        modelName: params.claudeResult.modelName,
        rawJson: JSON.stringify(params.claudeResult.rawJson),
        parsedJson: JSON.stringify(params.claudeResult.parsedJson),
        validSchema: true,
      },
    });

    assistantModelMessages.push(
      JSON.stringify({
        provider: "deepseek",
        modelName: claudeEval.modelName,
        validSchema: claudeEval.validSchema,
        parsedJson: claudeEval.parsedJson,
        rawJson: claudeEval.rawJson,
      }),
    );
  }

  const fusedEval = await prisma.fusedEvaluation.create({
    data: {
      essaySubmissionId: essaySubmission.id,
      fusedJson: JSON.stringify(params.fusedJson),
      agreementSummary: params.agreementSummary,
      disagreementFlags: JSON.stringify(params.disagreementFlags),
      mode: params.mode,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      role: "assistant",
      messageType: "fused_result",
      content: JSON.stringify({
        mode: params.mode,
        fusedJson: fusedEval.fusedJson,
        agreementSummary: fusedEval.agreementSummary,
        disagreementFlags: fusedEval.disagreementFlags,
        openaiResult: params.openaiResult
          ? {
              modelName: params.openaiResult.modelName,
              parsedJson: params.openaiResult.parsedJson,
              rawJson: params.openaiResult.rawJson,
            }
          : undefined,
        claudeResult: params.claudeResult
          ? {
              modelName: params.claudeResult.modelName,
              parsedJson: params.claudeResult.parsedJson,
              rawJson: params.claudeResult.rawJson,
            }
          : undefined,
      }),
    },
  });

  // Store model result messages after the fused review so the UI can show fused-first.
  for (const msg of assistantModelMessages) {
    await prisma.message.create({
      data: {
        conversationId: params.conversationId,
        role: "assistant",
        messageType: "model_result",
        content: msg,
      },
    });
  }

  return { fusedEvaluationId: fusedEval.id };
}

