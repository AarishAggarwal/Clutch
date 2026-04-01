"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const STORAGE_KEY = "fourYearCounselor:chat:v1";

export default function CounselorWidget() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw) as Msg[]);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading, open]);

  // Hide on landing + project workspace to avoid overlap/clutter.
  if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/projects")) return null;

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const user: Msg = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, user]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/counselor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.concat(user).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string; details?: string };
        throw new Error(payload.details ?? payload.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { reply: string };
      const ai: Msg = { id: `a-${Date.now()}`, role: "assistant", content: data.reply };
      setMessages((m) => [...m, ai]);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-lg"
          style={{
            borderColor: "color-mix(in oklab, var(--accent) 28%, var(--border-soft))",
            background: "color-mix(in oklab, var(--bg-elevated) 90%, var(--accent) 10%)",
            color: "var(--text-primary)",
          }}
        >
          <span className="inline-flex h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          4-Year Counselor
        </button>
      ) : (
        <div
          className="flex h-[70vh] max-h-[46rem] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-[0_22px_70px_-28px_rgba(15,23,42,0.55)]"
          style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}
        >
          <div className="flex items-start justify-between border-b px-4 py-3" style={{ borderColor: "var(--border-soft)" }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                4-Year Counselor
              </div>
              <div className="section-meta mt-0.5">
                Uses your profile, activities, essays, and docs.
              </div>
            </div>
            <div className="flex gap-1.5">
              <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={reset}>
                Reset
              </button>
              <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="space-y-2.5">
              {messages.length === 0 ? (
                <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)", color: "var(--text-secondary)" }}>
                  Ask anything like: "I am a sophomore interested in CS + biology, what should I focus on this year?"
                </div>
              ) : null}
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[88%] rounded-xl px-3 py-2 text-sm" style={{ background: "var(--text-primary)", color: "var(--bg-elevated)" }}>
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[94%] rounded-xl border px-3 py-2 text-sm whitespace-pre-wrap" style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}>
                      {m.content}
                    </div>
                  </div>
                ),
              )}
              {loading ? (
                <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                  Thinking...
                </div>
              ) : null}
              {error ? (
                <div className="text-xs" style={{ color: "var(--danger)" }}>
                  {error}
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t p-3" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask for personalized 4-year guidance..."
              rows={3}
              className="input-base resize-none text-sm"
              disabled={loading}
            />
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={() => void send()} disabled={loading || !input.trim()} className="btn-primary text-sm">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

