"use client";

import * as React from "react";
import MaterialIcon from "@/components/shell/MaterialIcon";

export type EssayComment = {
  id: string;
  authorId: string;
  authorRole: string;
  content: string;
  anchorStart: number;
  anchorEnd: number;
  quotedText: string;
  highlightColor: string;
  resolved: boolean;
  resolvedAt?: string | null;
  createdAt: string;
  replies?: EssayComment[];
};

type Props = {
  comments: EssayComment[];
  activeId: string | null;
  showResolved: boolean;
  onSelect: (id: string) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
  onToggleResolvedPanel: () => void;
};

export default function EssayCommentsPanel({
  comments,
  activeId,
  showResolved,
  onSelect,
  onResolve,
  onReopen,
  onReply,
  onToggleResolvedPanel,
}: Props) {
  const [replyDrafts, setReplyDrafts] = React.useState<Record<string, string>>({});
  const open = comments.filter((c) => !c.resolved);
  const resolved = comments.filter((c) => c.resolved);
  const list = showResolved ? resolved : open;

  return (
    <aside className="essay-rail flex w-72 shrink-0 flex-col border-l xl:w-80">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <MaterialIcon name="comment" className="!text-base text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">{showResolved ? "Resolved" : "Comments"}</h3>
        </div>
        <button type="button" onClick={onToggleResolvedPanel} className="text-xs font-medium text-primary hover:underline">
          {showResolved ? "Open" : `Resolved (${resolved.length})`}
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {list.length === 0 ? (
          <div className="empty-state !p-4 text-center text-xs">
            {showResolved ? "No resolved comments yet." : "Select text in your essay, then add a comment."}
          </div>
        ) : (
          list.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(c.id)}
              className={[
                "cursor-pointer rounded-lg border p-3 text-sm transition",
                activeId === c.id ? "list-selectable--active" : "border-border-subtle bg-surface-container-lowest hover:border-border-subtle hover:bg-surface",
              ].join(" ")}
            >
              <div className="mb-2 rounded-md border border-border-subtle bg-surface-container-low px-2 py-1.5 text-xs text-text-secondary line-clamp-2">
                &ldquo;{c.quotedText}&rdquo;
              </div>
              <p className="leading-relaxed text-text-primary">{c.content}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
                <span className="capitalize">
                  {c.authorRole} · {new Date(c.createdAt).toLocaleDateString()}
                </span>
                {showResolved ? (
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReopen(c.id);
                    }}
                  >
                    Reopen
                  </button>
                ) : (
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve(c.id);
                    }}
                  >
                    Resolve
                  </button>
                )}
              </div>
              {c.replies?.length ? (
                <div className="mt-2 space-y-1.5 border-t border-border-subtle pt-2">
                  {c.replies.map((r) => (
                    <div key={r.id} className="rounded-md bg-surface-container-low px-2 py-1.5 text-xs text-text-secondary">
                      <span className="font-medium capitalize text-text-primary">{r.authorRole}: </span>
                      {r.content}
                    </div>
                  ))}
                </div>
              ) : null}
              {!showResolved && !c.resolved ? (
                <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    value={replyDrafts[c.id] ?? ""}
                    onChange={(e) => setReplyDrafts((s) => ({ ...s, [c.id]: e.target.value }))}
                    placeholder="Reply…"
                    className="input-base !py-1.5 !text-xs"
                  />
                  <button
                    type="button"
                    className="btn-primary shrink-0 !px-2.5 !py-1.5 !text-xs"
                    onClick={() => {
                      const text = (replyDrafts[c.id] ?? "").trim();
                      if (!text) return;
                      onReply(c.id, text);
                      setReplyDrafts((s) => ({ ...s, [c.id]: "" }));
                    }}
                  >
                    Send
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
