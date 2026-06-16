"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/shell/MaterialIcon";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export default function NotificationsDropdown() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notification[]>([]);
  const unread = items.filter((n) => !n.readAt).length;

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = (await res.json()) as { notifications: Notification[] };
    setItems(data.notifications ?? []);
  }

  React.useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60000);
    return () => clearInterval(t);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    await load();
  }

  async function markRead(id: string, link?: string | null) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    await load();
    setOpen(false);
    if (link) router.push(link);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          void load();
        }}
        className="relative p-2 text-text-muted transition hover:text-primary"
        aria-label="Notifications"
      >
        <MaterialIcon name="notifications" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border-subtle bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 ? (
                <button type="button" onClick={() => void markAllRead()} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-text-muted">No notifications yet.</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void markRead(n.id, n.link)}
                    className={[
                      "block w-full border-b border-border-subtle px-4 py-3 text-left text-sm transition hover:bg-surface-container-high",
                      n.readAt ? "opacity-70" : "bg-blue-50/40",
                    ].join(" ")}
                  >
                    <div className="font-medium text-text-primary">{n.title}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{n.body}</div>
                    <div className="mt-1 text-[10px] text-text-muted">{new Date(n.createdAt).toLocaleString()}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
