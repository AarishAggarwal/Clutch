"use client";

import * as React from "react";

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Version history</h3>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
          {!loading && versions.length === 0 ? (
            <p className="text-sm text-gray-500">No versions saved yet.</p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{new Date(v.createdAt).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {v.authorRole} · {v.wordCount} words
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                    onClick={() => onRestore(v.id)}
                  >
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
