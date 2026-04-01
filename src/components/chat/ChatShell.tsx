"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar, { type ConversationListItem } from "@/components/chat/Sidebar";
import ChatThread from "@/components/chat/ChatThread";
import ChatComposer from "@/components/chat/ChatComposer";
import { type EssayType } from "@/lib/types";
import { getMockConversationMessages, mockConversations } from "@/lib/mockChatData";
import { runLocalMockEvaluation } from "@/lib/localMockEvaluation";
import { supplementalUniversities } from "@/lib/supplementalPrompts";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  messageType: "plain_text" | "essay_submission" | "fused_result" | "model_result" | "meta";
  content: string;
  createdAt: string;
};

const statusPhases = [
  "Analyzing your essay",
  "Scoring key dimensions",
  "Preparing feedback",
  "Finalizing your review",
];

function getFallbackConversationTitle(conversationId: string | null) {
  if (!conversationId) return "New essay review";
  const mock = mockConversations.find((c) => c.id === conversationId);
  return mock?.title ?? "New essay review";
}

export default function ChatShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromQuery = searchParams.get("conversationId");

  const [conversations, setConversations] = React.useState<ConversationListItem[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(
    conversationIdFromQuery ?? mockConversations[0]?.id ?? null,
  );
  const [messages, setMessages] = React.useState<ChatMessage[]>(
    activeConversationId ? (getMockConversationMessages(activeConversationId) as any) : [],
  );

  const [essayType, setEssayType] = React.useState<EssayType>("common_app_personal_statement");
  const [essayTitle, setEssayTitle] = React.useState("");
  const [supplementalUniversityId, setSupplementalUniversityId] = React.useState("");
  const [supplementalPromptId, setSupplementalPromptId] = React.useState("");
  const [essayText, setEssayText] = React.useState("");

  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [evaluatingStatusText, setEvaluatingStatusText] = React.useState(statusPhases[0]);
  const statusTimerRef = React.useRef<number | null>(null);

  const [composerError, setComposerError] = React.useState<string | null>(null);

  function clearStatusTimer() {
    if (statusTimerRef.current) {
      window.clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }

  async function loadConversations() {
    const res = await fetch("/api/conversations", { method: "GET" });
    if (!res.ok) throw new Error("Failed to load conversations");
    const data = (await res.json()) as { conversations: ConversationListItem[] };
    return data.conversations;
  }

  async function loadMessages(conversationId: string) {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, { method: "GET" });
    if (!res.ok) throw new Error("Failed to load messages");
    const data = (await res.json()) as { messages: ChatMessage[] };
    return data.messages;
  }

  async function createNewConversation() {
    const res = await fetch("/api/conversations/new", { method: "POST" });
    if (!res.ok) throw new Error("Failed to create conversation");
    const data = (await res.json()) as { conversationId: string };
    return data.conversationId;
  }

  async function handleInit() {
    try {
      const convs = await loadConversations();
      const targetId = conversationIdFromQuery ?? convs[0]?.id ?? null;
      setConversations(convs);
      setActiveConversationId(targetId);

      if (targetId) {
        const msgs = await loadMessages(targetId);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    } catch {
      // UI preview fallback if Prisma/DB isn't migrated yet.
      const fallbackId = conversationIdFromQuery ?? mockConversations[0]?.id ?? null;
      setActiveConversationId(fallbackId);
      setConversations(mockConversations);
      setMessages(fallbackId ? (getMockConversationMessages(fallbackId) as any) : []);
    }
  }

  React.useEffect(() => {
    // Re-load if URL changes.
    void handleInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationIdFromQuery]);

  React.useEffect(() => {
    // If active conversation changes and we already have a real list, try to load.
    if (!activeConversationId) return;
    if (activeConversationId.startsWith("mock-")) return;

    void (async () => {
      try {
        const msgs = await loadMessages(activeConversationId);
        setMessages(msgs);
      } catch {
        setMessages(getMockConversationMessages(activeConversationId) as any);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  React.useEffect(() => {
    return () => clearStatusTimer();
  }, []);

  const headerTitle = getFallbackConversationTitle(activeConversationId);
  const selectedSupplementalUniversity = supplementalUniversities.find((u) => u.id === supplementalUniversityId);
  const selectedSupplementalPrompt = selectedSupplementalUniversity?.prompts.find(
    (p) => p.id === supplementalPromptId,
  );

  async function handleNewChat() {
    clearStatusTimer();
    setIsEvaluating(false);
    setComposerError(null);

    try {
      const newId = await createNewConversation();
      const nextConvs = await loadConversations().catch(() => conversations);
      setConversations(nextConvs);
      setActiveConversationId(newId);
      router.push(`/chat?conversationId=${encodeURIComponent(newId)}`);
      setMessages([]); // will load from effect
    } catch {
      // Mock fallback: keep the demo conversation.
      setActiveConversationId(mockConversations[0]?.id ?? null);
      setConversations(mockConversations);
      setMessages(getMockConversationMessages(mockConversations[0]?.id ?? "mock-conv-1") as any);
    }
  }

  async function handleSubmit() {
    setComposerError(null);
    if (!activeConversationId) {
      setComposerError("Please start a new chat first.");
      return;
    }
    const trimmed = essayText.trim();
    if (!trimmed) {
      setComposerError("Essay text can’t be empty.");
      return;
    }
    if (essayText.length > 20000) {
      setComposerError("Essay is too long for this prototype (max 20,000 characters).");
      return;
    }
    if (essayType === "supplemental_essay") {
      if (!selectedSupplementalUniversity) {
        setComposerError("Please select a university.");
        return;
      }
      if (!selectedSupplementalPrompt) {
        setComposerError("Please select which prompt you answered.");
        return;
      }
    }

    setIsEvaluating(true);
    setEvaluatingStatusText(statusPhases[0]);

    clearStatusTimer();
    let idx = 0;
    statusTimerRef.current = window.setInterval(() => {
      idx = Math.min(statusPhases.length - 1, idx + 1);
      setEvaluatingStatusText(statusPhases[idx]);
    }, 900);

    // Optimistic UI to keep flow feeling premium.
    const optimisticUserMessage: ChatMessage = {
      id: `tmp-user-${Date.now()}`,
      role: "user",
      messageType: "essay_submission",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const evalRes = await fetch(`/api/conversations/${activeConversationId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayType,
          title: essayType === "supplemental_essay" ? undefined : essayTitle.trim() ? essayTitle.trim() : undefined,
          supplementalUniversityId: essayType === "supplemental_essay" ? selectedSupplementalUniversity?.id : undefined,
          supplementalUniversityName:
            essayType === "supplemental_essay" ? selectedSupplementalUniversity?.name : undefined,
          supplementalPromptId: essayType === "supplemental_essay" ? selectedSupplementalPrompt?.id : undefined,
          supplementalPromptQuestion:
            essayType === "supplemental_essay" ? selectedSupplementalPrompt?.question : undefined,
          supplementalPromptCycleYear:
            essayType === "supplemental_essay" ? selectedSupplementalPrompt?.cycleYear : undefined,
          content: trimmed,
        }),
      });
      if (!evalRes.ok) {
        let details = `HTTP ${evalRes.status}`;
        try {
          const payload = (await evalRes.json()) as { error?: string; details?: string };
          details = payload.details ?? payload.error ?? details;
        } catch {
          // ignore parse errors and keep generic HTTP status
        }
        throw new Error(`Evaluation request failed: ${details}`);
      }

      // Reload messages from persisted storage.
      const msgs = await loadMessages(activeConversationId);
      setMessages(msgs);
      setEssayText("");
      setEssayTitle("");
      setSupplementalPromptId("");
    } catch (err: any) {
      // If the SQLite DB/API isn't ready yet, still keep the UX interactive by producing a local fused review.
      try {
        const local = runLocalMockEvaluation({ essayType, essayText: trimmed });
        const assistantPayload = JSON.stringify(local);
        const assistantMessage: ChatMessage = {
          id: `tmp-assistant-${Date.now()}`,
          role: "assistant",
          messageType: "fused_result",
          content: assistantPayload,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setEssayText("");
        setEssayTitle("");
        setSupplementalPromptId("");
      } catch {
        setComposerError(String(err?.message ?? "Evaluation failed."));
      }
    } finally {
      setIsEvaluating(false);
      clearStatusTimer();
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={(id) => {
          setComposerError(null);
          setActiveConversationId(id);
          router.push(`/chat?conversationId=${encodeURIComponent(id)}`);
        }}
      />

      <main className="chat-surface flex min-w-0 flex-1 flex-col border-l" style={{ borderColor: "var(--border-soft)" }}>
        <header
          className="flex items-center justify-between gap-3 border-b px-3 py-3 sm:px-5"
          style={{ borderColor: "var(--border-soft)", background: "color-mix(in oklab, var(--bg-elevated) 94%, transparent)" }}
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {headerTitle}
            </div>
            <div className="section-meta mt-0.5">Structured essay review with revision guidance—paste and submit.</div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={handleNewChat} disabled={isEvaluating} className="btn-secondary text-sm disabled:opacity-50">
              New chat
            </button>
          </div>
        </header>

        <ChatThread messages={messages} isEvaluating={isEvaluating} evaluatingStatusText={evaluatingStatusText} />

        <ChatComposer
          essayType={essayType}
          onEssayTypeChange={(nextType) => {
            setEssayType(nextType);
            setComposerError(null);
            if (nextType !== "supplemental_essay") {
              setSupplementalUniversityId("");
              setSupplementalPromptId("");
            }
          }}
          essayText={essayText}
          onEssayTextChange={setEssayText}
          essayTitle={essayTitle}
          onEssayTitleChange={setEssayTitle}
          supplementalUniversityId={supplementalUniversityId}
          onSupplementalUniversityIdChange={(id) => {
            setSupplementalUniversityId(id);
            setSupplementalPromptId("");
          }}
          supplementalPromptId={supplementalPromptId}
          onSupplementalPromptIdChange={setSupplementalPromptId}
          isSubmitting={isEvaluating}
          disabledReason={composerError ?? undefined}
          onSubmit={handleSubmit}
        />

        {composerError ? (
          <div
            className="mx-auto w-full max-w-4xl px-4 pb-3 text-center text-sm"
            style={{ color: "var(--danger)" }}
          >
            {composerError}
          </div>
        ) : null}
      </main>
    </div>
  );
}

