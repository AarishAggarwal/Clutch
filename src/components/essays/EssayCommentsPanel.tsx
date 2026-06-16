"use client";

import * as React from "react";

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
    <aside className="flex w-80 shrink-0 flex-col border-l border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{showResolved ? "Resolved" : "Comments"}</h3>
        <button type="button" onClick={onToggleResolvedPanel} className="text-xs text-blue-600 hover:underline">
          {showResolved ? "Open comments" : `Resolved (${resolved.length})`}
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {list.length === 0 ? (
          <p className="text-xs text-gray-500">
            {showResolved ? "No resolved comments yet." : "Select text and add a comment to start a thread."}
          </p>
        ) : (
          list.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(c.id)}
              className={[
                "cursor-pointer rounded-lg border bg-white p-3 text-sm shadow-sm transition",
                activeId === c.id ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-200 hover:border-gray-300",
              ].join(" ")}
            >
              <div className="mb-2 rounded bg-yellow-100 px-2 py-1 text-xs text-gray-700 line-clamp-2">{c.quotedText}</div>
              <p className="text-gray-800">{c.content}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                <span>
                  {c.authorRole} · {new Date(c.createdAt).toLocaleString()}
                </span>
                {showResolved ? (
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
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
                    className="text-blue-600 hover:underline"
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
                <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
                  {c.replies.map((r) => (
                    <div key={r.id} className="rounded bg-gray-50 px-2 py-1.5 text-xs">
                      <span className="font-medium text-gray-600">{r.authorRole}: </span>
                      {r.content}
                    </div>
                  ))}
                </div>
              ) : null}
              {!showResolved && !c.resolved ? (
                <div className="mt-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    value={replyDrafts[c.id] ?? ""}
                    onChange={(e) => setReplyDrafts((s) => ({ ...s, [c.id]: e.target.value }))}
                    placeholder="Reply…"
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    className="rounded bg-gray-900 px-2 py-1 text-xs text-white"
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
