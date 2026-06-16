"use client";

import * as React from "react";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export default function ResourcesPage() {
  const [mode, setMode] = React.useState<"general" | "activities">("general");
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
          mode,
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
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-4xl space-y-4">
        <h1 className="page-title">Resources</h1>
        <p className="page-subtitle">Use 4-year guidance for general planning, or switch to activity-focused coaching.</p>
        <div className="nav-pill w-fit">
          <button type="button" onClick={() => setMode("general")} className={`nav-pill-link ${mode === "general" ? "nav-pill-link--active" : ""}`}>4-Year Counselor</button>
          <button type="button" onClick={() => setMode("activities")} className={`nav-pill-link ${mode === "activities" ? "nav-pill-link--active" : ""}`}>Activities Chatbot</button>
        </div>
        <div className="panel p-4">
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className="inline-block max-w-[90%] rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading ? <div className="section-meta">Thinking…</div> : null}
            {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="input-base mt-3 h-24 w-full resize-y" placeholder={mode === "activities" ? "Ask for activity-specific feedback..." : "Ask for general counselor guidance..."} />
          <button type="button" className="btn-primary mt-2 text-sm" onClick={() => void send()} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
