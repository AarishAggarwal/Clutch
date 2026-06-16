"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import MaterialIcon from "@/components/shell/MaterialIcon";

type Msg = { id: string; role: "user" | "assistant"; content: string; createdAt?: string };

type Tab = "essay_assistant" | "four_year_counselor";

type EssayOption = {
  id: string;
  title: string;
  essayType: string;
  universitySlug?: string | null;
  universityName?: string | null;
  wordCount: number;
  status: string;
};

type EssayCategory = "common" | "supplement";

const CONFIG = {
  essay_assistant: {
    title: "Essay Assistant",
    subtitle: "Brainstorming, grammar, tone, and college-specific essay feedback.",
    icon: "edit_note",
    placeholder: "Ask about your essay — e.g. improve paragraph 2 or adjust tone…",
    suggestions: [
      "Improve my opening paragraph",
      "Check grammar and clarity",
      "Make this more concise",
      "Suggest a stronger conclusion",
    ],
    contextNote: "Select a draft below — its text, prompt, and word limit are sent with each message.",
  },
  four_year_counselor: {
    title: "4-Year Counselor",
    subtitle: "Common App, UC, UK and Indian admissions, timelines, and extracurricular strategy.",
    icon: "school",
    placeholder: "Ask about your application plan — e.g. course selection or timeline…",
    suggestions: [
      "What should I prioritize in grade 11?",
      "How do I balance reach and safety schools?",
      "Help me plan my extracurriculars",
      "Explain UC vs Common App differences",
    ],
    contextNote: "General admissions guidance — share your grade, interests, and goals for tailored advice.",
  },
} as const;

function formatTime(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

export default function AssistantHub() {
  const searchParams = useSearchParams();
  const initialTab: Tab = searchParams.get("tab") === "counselor" ? "four_year_counselor" : "essay_assistant";
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [essayMessages, setEssayMessages] = React.useState<Msg[]>([]);
  const [counselorMessages, setCounselorMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [essayId, setEssayId] = React.useState<string>("");
  const [essays, setEssays] = React.useState<EssayOption[]>([]);
  const [essayCategory, setEssayCategory] = React.useState<EssayCategory>("common");
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const config = CONFIG[tab];
  const messages = tab === "essay_assistant" ? essayMessages : counselorMessages;
  const setMessages = tab === "essay_assistant" ? setEssayMessages : setCounselorMessages;

  const { commonEssays, supplementEssays } = React.useMemo(() => ({
    commonEssays: essays.filter((e) => e.essayType.includes("common") || !e.universitySlug),
    supplementEssays: essays.filter((e) => e.universitySlug || e.essayType.includes("supplement")),
  }), [essays]);
  const filteredEssays = essayCategory === "common" ? commonEssays : supplementEssays;
  const selectedEssay = essays.find((e) => e.id === essayId) ?? null;

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/essays");
      if (!res.ok) return;
      const data = (await res.json()) as { essays: EssayOption[] };
      setEssays(data.essays ?? []);
    })();
  }, []);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("activeEssayId");
    if (stored && essays.some((e) => e.id === stored)) {
      setEssayId(stored);
      const essay = essays.find((e) => e.id === stored);
      if (essay) {
        setEssayCategory(essay.universitySlug || essay.essayType.includes("supplement") ? "supplement" : "common");
      }
    }
  }, [essays]);

  React.useEffect(() => {
    const eid = searchParams.get("essayId");
    if (eid && essays.some((e) => e.id === eid)) {
      setEssayId(eid);
      const essay = essays.find((e) => e.id === eid);
      if (essay) {
        setEssayCategory(essay.universitySlug || essay.essayType.includes("supplement") ? "supplement" : "common");
      }
    }
  }, [searchParams, essays]);

  React.useEffect(() => {
    if (!essayId) return;
    window.localStorage.setItem("activeEssayId", essayId);
  }, [essayId]);

  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "counselor") setTab("four_year_counselor");
    else if (tabParam === "essay-assistant" || tabParam === "essay") setTab("essay_assistant");
  }, [searchParams]);

  React.useEffect(() => {
    if (tab !== "essay_assistant") return;
    if (essayId && filteredEssays.some((e) => e.id === essayId)) return;
    if (filteredEssays[0]) setEssayId(filteredEssays[0].id);
    else setEssayId("");
  }, [essayCategory, tab, filteredEssays, essayId]);

  React.useEffect(() => {
    void (async () => {
      const kind = tab === "essay_assistant" ? "essay_assistant" : "four_year_counselor";
      const res = await fetch(`/api/assistant/conversations?kind=${kind}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Array<{ id: string; role: string; content: string; createdAt: string }> };
      const mapped = (data.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt,
      }));
      if (tab === "essay_assistant") setEssayMessages(mapped);
      else setCounselorMessages(mapped);
    })();
  }, [tab]);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  React.useEffect(() => {
    setError(null);
    setInput("");
  }, [tab]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    const user: Msg = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, user]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const endpoint = tab === "essay_assistant" ? "/api/essay-assistant/chat" : "/api/counselor/chat";
      const body = tab === "essay_assistant" ? { message: text, essayId: essayId || undefined } : { message: text };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        reply?: string;
        messages?: Array<{ id: string; role: string; content: string; createdAt: string }>;
        error?: string;
        details?: string;
      };
      if (!res.ok || !data.reply) throw new Error(data.details || data.error || "Chat failed");
      if (data.messages) {
        const mapped = data.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
        }));
        setMessages(mapped);
      } else {
        setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: data.reply! }]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-container-low">
      <header className="shrink-0 border-b border-border-subtle bg-surface px-6 py-5 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-white shadow-sm">
            <MaterialIcon name={config.icon} className="text-[22px]" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-text-primary">{config.title}</h1>
            <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{config.subtitle}</p>
            <p className="mt-2 text-xs text-text-muted">{config.contextNote}</p>
          </div>
        </div>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {messages.length === 0 && !loading ? (
            <div className="rounded-2xl border border-border-subtle bg-surface px-5 py-6 shadow-sm">
              <p className="text-sm font-medium text-text-primary">How can I help you today?</p>
              <p className="mt-1 text-sm text-text-secondary">Choose a prompt below or type your own question.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {config.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-border-subtle bg-surface-container-high px-3.5 py-2 text-left text-xs text-text-secondary transition hover:border-primary/30 hover:bg-primary/5 hover:text-text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) => {
            const isUser = m.role === "user";
            const time = formatTime(m.createdAt);
            return (
              <div key={m.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    isUser
                      ? "bg-primary-fixed text-primary"
                      : "border border-border-subtle bg-surface text-text-secondary",
                  ].join(" ")}
                  aria-hidden
                >
                  {isUser ? "You" : <MaterialIcon name={config.icon} className="!text-base" />}
                </div>
                <div className={`min-w-0 max-w-[min(100%,42rem)] ${isUser ? "text-right" : ""}`}>
                  <div className={`mb-1 flex items-center gap-2 text-[11px] font-medium text-text-muted ${isUser ? "justify-end" : ""}`}>
                    <span>{isUser ? "You" : config.title}</span>
                    {time ? <span>· {time}</span> : null}
                  </div>
                  <div
                    className={[
                      "rounded-2xl px-4 py-3 text-left text-sm leading-relaxed",
                      isUser
                        ? "rounded-tr-md border border-primary/15 bg-primary-fixed text-text-primary"
                        : "rounded-tl-md border border-border-subtle bg-surface text-text-primary shadow-sm",
                    ].join(" ")}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {loading ? (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary">
                <MaterialIcon name={config.icon} className="!text-base" />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-border-subtle bg-surface px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="alert-error mx-auto max-w-4xl rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <footer className="shrink-0 border-t border-border-subtle bg-surface px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          {tab === "essay_assistant" ? (
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-auto sm:min-w-[10rem]">
                <label className="field-label">Essay type</label>
                <select
                  className="input-base !text-xs"
                  value={essayCategory}
                  onChange={(e) => setEssayCategory(e.target.value as EssayCategory)}
                >
                  <option value="common">Common App</option>
                  <option value="supplement">Supplements</option>
                </select>
              </div>
              <div className="min-w-0 flex-1 sm:min-w-[14rem]">
                <label className="field-label">Draft to review</label>
                <select
                  className="input-base !text-xs"
                  value={essayId}
                  onChange={(e) => setEssayId(e.target.value)}
                  disabled={!filteredEssays.length}
                >
                  {!filteredEssays.length ? (
                    <option value="">No drafts in this category</option>
                  ) : (
                    filteredEssays.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title || "Untitled"} ({e.wordCount} words)
                      </option>
                    ))
                  )}
                </select>
              </div>
              {selectedEssay ? (
                <p className="pb-2 text-xs text-text-muted">
                  Reviewing: <span className="font-medium text-text-secondary">{selectedEssay.title}</span>
                  {selectedEssay.universityName ? ` · ${selectedEssay.universityName}` : ""}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="flex items-end gap-2 rounded-2xl border border-border-subtle bg-surface-container-high p-2 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
              placeholder={config.placeholder}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <MaterialIcon name="send" className="!text-lg" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-text-muted">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </footer>
    </div>
  );
}
