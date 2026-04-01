"use client";

import * as React from "react";

export type ConversationListItem = {
  id: string;
  title: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastMessagePreview: string;
};

export default function Sidebar(props: {
  conversations: ConversationListItem[];
  activeConversationId?: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
}) {
  const { conversations, activeConversationId, onNewChat, onSelectConversation } = props;

  return (
    <aside
      className="hidden w-[19rem] shrink-0 flex-col border-r p-4 lg:flex"
      style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Essay reviews
          </div>
          <div className="section-meta mt-0.5 truncate">Threaded evaluations · local-first</div>
        </div>
      </div>

      <div className="mt-4">
        <button type="button" onClick={onNewChat} className="btn-primary w-full gap-2">
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          New conversation
        </button>
      </div>

      <div className="mt-5">
        <div className="kpi-label">History</div>

        <div className="mt-3 space-y-1.5 overflow-auto pr-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
          {conversations.length === 0 ? (
            <div className="empty-state">Start your first review. Each thread stores the full feedback payload locally.</div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeConversationId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectConversation(c.id)}
                  className={["list-selectable", isActive ? "list-selectable--active" : ""].join(" ")}
                >
                  <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {c.title}
                  </div>
                  <div className="section-meta mt-1 line-clamp-2 leading-relaxed">{c.lastMessagePreview}</div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
