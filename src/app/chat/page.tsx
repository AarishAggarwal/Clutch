import * as React from "react";
import ChatClient from "./ChatClient";

export default function ChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-6">
          <div className="section-meta">Loading essay workspace…</div>
        </div>
      }
    >
      <ChatClient />
    </React.Suspense>
  );
}

