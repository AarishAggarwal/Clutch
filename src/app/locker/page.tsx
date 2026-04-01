"use client";

import * as React from "react";

type LockerDoc = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type LockerPayload = {
  filename: string;
  mimeType: string;
  size: number;
  data: string;
  uploadedAt?: string;
};

function parsePayload(content: string): LockerPayload | null {
  try {
    return JSON.parse(content) as LockerPayload;
  } catch {
    return null;
  }
}

function prettySize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LockerPage() {
  const [files, setFiles] = React.useState<LockerDoc[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<{ id: string; payload: LockerPayload } | null>(null);

  async function refresh() {
    const res = await fetch("/api/locker");
    const data = (await res.json()) as { files: LockerDoc[] };
    setFiles(data.files ?? []);
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/locker", { method: "POST", body: form });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string; details?: string };
        throw new Error(payload.details ?? payload.error ?? `HTTP ${res.status}`);
      }
      await refresh();
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function remove(id: string) {
    await fetch(`/api/locker/${id}`, { method: "DELETE" });
    await refresh();
  }

  function download(doc: LockerDoc) {
    const payload = parsePayload(doc.content);
    if (!payload) return;
    const url = `data:${payload.mimeType};base64,${payload.data}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = payload.filename || doc.title;
    a.click();
  }

  async function openPreview(doc: LockerDoc) {
    const res = await fetch(`/api/locker/${doc.id}/content`);
    if (!res.ok) return;
    const data = (await res.json()) as { payload: LockerPayload };
    setPreview({ id: doc.id, payload: data.payload });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Locker</h1>
            <p className="page-subtitle">Upload and store certificates, honors, and supporting files.</p>
          </div>
          <label className="btn-primary cursor-pointer">
            {uploading ? "Uploading..." : "Upload file"}
            <input type="file" className="hidden" onChange={(e) => void onUpload(e)} disabled={uploading} />
          </label>
        </div>

        {error ? (
          <div className="mb-3 text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </div>
        ) : null}

        <section className="panel p-4">
          {files.length === 0 ? (
            <div className="empty-state">No files yet. Upload certificates or honors documents to your locker.</div>
          ) : (
            <div className="space-y-2">
              {files.map((f) => {
                const payload = parsePayload(f.content);
                return (
                  <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-soft)" }}>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {payload?.filename ?? f.title}
                      </div>
                      <div className="section-meta mt-1">
                        {payload ? `${payload.mimeType} · ${prettySize(payload.size)}` : "Unknown file type"} ·{" "}
                        {new Date(f.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs px-2.5 py-1.5" onClick={() => void openPreview(f)}>
                        Preview
                      </button>
                      <button className="btn-secondary text-xs px-2.5 py-1.5" onClick={() => download(f)}>
                        Download
                      </button>
                      <button className="btn-ghost text-xs px-2.5 py-1.5" onClick={() => void remove(f.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {preview ? (
          <section className="panel mt-4 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="section-heading">Preview · {preview.payload.filename}</div>
              <button className="btn-ghost text-xs" onClick={() => setPreview(null)}>Close</button>
            </div>
            {preview.payload.mimeType.startsWith("image/") ? (
              <img
                src={`data:${preview.payload.mimeType};base64,${preview.payload.data}`}
                alt={preview.payload.filename}
                className="max-h-[30rem] rounded-lg border"
                style={{ borderColor: "var(--border-soft)" }}
              />
            ) : preview.payload.mimeType === "application/pdf" ? (
              <iframe
                title={preview.payload.filename}
                src={`data:${preview.payload.mimeType};base64,${preview.payload.data}`}
                className="h-[38rem] w-full rounded-lg border"
                style={{ borderColor: "var(--border-soft)" }}
              />
            ) : (
              <div className="section-meta">Preview not available for this file type. Use Download.</div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

