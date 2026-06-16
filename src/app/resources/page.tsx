import { Suspense } from "react";
import AssistantHub from "@/components/assistant/AssistantHub";

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-text-muted">Loading assistants…</p>
        </div>
      }
    >
      <AssistantHub />
    </Suspense>
  );
}
