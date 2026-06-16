"use client";

import * as React from "react";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export default function ResourcesPage() {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

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
      const res = await fetch("/api/counselor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode: "general",
          history: messages.concat(user).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string; details?: string };
      if (!res.ok || !data.reply) throw new Error(data.details || data.error || "Chat failed");
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: data.reply! }]);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full overflow-hidden bg-[#f8f9fb]">
      <div className="mx-auto flex h-full max-w-5xl flex-col px-4 py-4 sm:px-6">
        <div className="mb-3">
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            4-Year Counselor
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Ask focused admissions questions and get structured planning advice.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: "var(--border-soft)" }}>
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="mx-auto w-full max-w-3xl space-y-4">
              {messages.length === 0 ? (
                <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}>
                  Try: I am in grade 11 interested in CS and economics. What should I prioritize this month?
                </div>
              ) : null}
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={m.role === "user" ? "max-w-[82%] rounded-2xl px-4 py-3 text-sm text-white" : "max-w-[92%] rounded-2xl border px-4 py-3 text-sm"}
                    style={
                      m.role === "user"
                        ? { background: "#1f2937" }
                        : { borderColor: "var(--border-soft)", color: "var(--text-primary)", background: "#fbfbfc" }
                    }
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {loading ? <div className="text-sm text-text-secondary">Thinking...</div> : null}
              {error ? <div className="text-sm" style={{ color: "var(--danger)" }}>{error}</div> : null}
            </div>
          </div>

          <div className="border-t px-4 py-3 sm:px-6" style={{ borderColor: "var(--border-soft)" }}>
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
                className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: "var(--border-soft)", color: "var(--text-primary)" }}
                placeholder="Message 4-Year Counselor..."
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button type="button" className="btn-primary text-sm" onClick={() => void send()} disabled={loading || !input.trim()}>
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
