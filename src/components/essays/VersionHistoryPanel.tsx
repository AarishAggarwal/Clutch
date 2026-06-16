"use client";

import * as React from "react";
import MaterialIcon from "@/components/shell/MaterialIcon";

export type EssayVersion = {
  id: string;
  wordCount: number;
  characterCount: number;
  authorRole: string;
  createdAt: string;
};

type Props = {
  open: boolean;
  versions: EssayVersion[];
  onClose: () => void;
  onRestore: (versionId: string) => void;
  loading?: boolean;
};

export default function VersionHistoryPanel({ open, versions, onClose, onRestore, loading }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-overlay backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-border-subtle bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <MaterialIcon name="history" className="!text-base text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Version history</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost !px-2 !py-1 !text-xs">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <p className="section-meta">Loading versions…</p> : null}
          {!loading && versions.length === 0 ? (
            <div className="empty-state text-center text-sm">No versions saved yet. Edits are saved automatically.</div>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-container-lowest px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-text-primary">{new Date(v.createdAt).toLocaleString()}</div>
                    <div className="section-meta mt-0.5 capitalize">
                      {v.authorRole} · {v.wordCount} words
                    </div>
                  </div>
                  <button type="button" className="btn-primary !px-2.5 !py-1 !text-xs" onClick={() => onRestore(v.id)}>
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
