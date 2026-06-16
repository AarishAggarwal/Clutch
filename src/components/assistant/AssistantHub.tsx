"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

type Msg = { id: string; role: "user" | "assistant"; content: string; createdAt?: string };

type Tab = "essay_assistant" | "four_year_counselor";

export default function AssistantHub() {
  const searchParams = useSearchParams();
  const initialTab: Tab = searchParams.get("tab") === "counselor" ? "four_year_counselor" : "essay_assistant";
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [essayMessages, setEssayMessages] = React.useState<Msg[]>([]);
  const [counselorMessages, setCounselorMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [essayId, setEssayId] = React.useState<string | undefined>();
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const messages = tab === "essay_assistant" ? essayMessages : counselorMessages;
  const setMessages = tab === "essay_assistant" ? setEssayMessages : setCounselorMessages;

  React.useEffect(() => {
    const stored = window.localStorage.getItem("activeEssayId");
    if (stored && !essayId) setEssayId(stored);
  }, []);

  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "counselor") setTab("four_year_counselor");
    else if (tabParam === "essay-assistant" || tabParam === "essay") setTab("essay_assistant");
    const eid = searchParams.get("essayId");
    if (eid) setEssayId(eid);
  }, [searchParams]);

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

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const user: Msg = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, user]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const endpoint = tab === "essay_assistant" ? "/api/essay-assistant/chat" : "/api/counselor/chat";
      const body =
        tab === "essay_assistant"
          ? { message: text, essayId }
          : { message: text };
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
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#f8f9fb]">
      <aside className="flex w-52 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Assistants
        </div>
        <button
          type="button"
          onClick={() => setTab("essay_assistant")}
          className={[
            "px-4 py-3 text-left text-sm",
            tab === "essay_assistant" ? "bg-blue-50 font-medium text-blue-800" : "text-gray-600 hover:bg-gray-50",
          ].join(" ")}
        >
          Essay Assistant
        </button>
        <button
          type="button"
          onClick={() => setTab("four_year_counselor")}
          className={[
            "px-4 py-3 text-left text-sm",
            tab === "four_year_counselor" ? "bg-blue-50 font-medium text-blue-800" : "text-gray-600 hover:bg-gray-50",
          ].join(" ")}
        >
          4-Year Counselor
        </button>
        {tab === "essay_assistant" ? (
          <div className="mt-auto border-t border-gray-100 p-3 text-xs text-gray-500">
            Open an essay in Essays — context (text, prompt, limits) is sent automatically when you chat.
          </div>
        ) : (
          <div className="mt-auto border-t border-gray-100 p-3 text-xs text-gray-500">
            Common App, UC, UK, India, timelines, ECs, and course strategy.
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-6">
        <div className="mb-3">
          <h1 className="text-xl font-semibold text-gray-900">
            {tab === "essay_assistant" ? "Essay Assistant" : "4-Year Counselor"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {tab === "essay_assistant"
              ? "Brainstorming, grammar, tone, and college-specific essay feedback."
              : "Application strategy, timelines, and extracurricular planning."}
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="mx-auto w-full max-w-3xl space-y-4">
              {messages.length === 0 ? (
                <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500">
                  {tab === "essay_assistant"
                    ? "Try: Improve paragraph 2 and make the opening more vivid."
                    : "Try: I am in grade 11 interested in CS. What should I prioritize this month?"}
                </div>
              ) : null}
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[82%] rounded-2xl bg-gray-900 px-4 py-3 text-sm text-white"
                        : "max-w-[92%] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                    }
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {loading ? <div className="text-sm text-gray-500">Thinking…</div> : null}
              {error ? <div className="text-sm text-red-600">{error}</div> : null}
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
            <div className="mx-auto w-full max-w-3xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    void send();
                  }
                }}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder={tab === "essay_assistant" ? "Message Essay Assistant…" : "Message 4-Year Counselor…"}
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button type="button" className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={() => void send()} disabled={loading || !input.trim()}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
