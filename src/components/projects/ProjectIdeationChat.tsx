"use client";

import * as React from "react";

type Msg = {
  id: string;
  role: string;
  messageType: string;
  content: string;
  createdAt: string;
};

const STORAGE_KEY = "projectIdeationConversationId";

export default function ProjectIdeationChat() {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingBoot, setLoadingBoot] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  React.useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (!stored) {
      setLoadingBoot(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/conversations/${encodeURIComponent(stored)}/messages`);
        if (!res.ok) throw new Error("load");
        const data = (await res.json()) as { messages: Msg[] };
        setMessages(data.messages ?? []);
        setConversationId(stored);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoadingBoot(false);
      }
    })();
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setLoading(true);
    setInput("");
    try {
      const res = await fetch("/api/project-ideation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { details?: string; error?: string };
        throw new Error(payload.details ?? payload.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { conversationId: string; messages: Msg[] };
      setConversationId(data.conversationId);
      sessionStorage.setItem(STORAGE_KEY, data.conversationId);
      setMessages(data.messages ?? []);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY);
    setConversationId(null);
    setMessages([]);
    setError(null);
  }

  if (loadingBoot) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="section-meta">Loading project chat…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-4 py-3 sm:px-6" style={{ borderColor: "var(--border-soft)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Project ideation chat
            </h1>
            <p className="section-meta mt-0.5 max-w-2xl">
              Brainstorm bold, workable project angles—complements the essay chatbot, tuned for invention, impact, and
              standout narrative.
            </p>
          </div>
          <button type="button" onClick={clearSession} className="btn-secondary text-sm">
            New session
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages
            .filter((m) => m.messageType === "plain_text" || m.messageType === "meta")
            .map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div
                    className="max-w-[90%] rounded-2xl border px-4 py-3 text-sm shadow-sm"
                    style={{
                      borderColor: "var(--border-strong)",
                      background: "var(--text-primary)",
                      color: "var(--bg-elevated)",
                    }}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">You</div>
                    <div className="mt-1.5 whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div className="panel max-w-[90%] px-4 py-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      Ideation partner
                    </div>
                    <div className="mt-1.5 whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ),
            )}

          {loading ? (
            <div className="flex justify-start">
              <div className="panel-muted flex items-center gap-2 px-4 py-3 text-sm">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--accent)" }} />
                Thinking…
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t p-4 sm:p-6" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {error ? (
            <div className="text-center text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </div>
          ) : null}
          <label className="field-label">Your message</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Describe an idea, constraint, or question… (Ctrl+Enter to send)"
            rows={4}
            disabled={loading}
            className="input-base resize-y leading-relaxed"
          />
          <div className="flex justify-end">
            <button type="button" onClick={() => void send()} disabled={loading || !input.trim()} className="btn-primary">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
