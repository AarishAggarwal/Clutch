import { Suspense } from "react";
import EssayWorkspace from "@/components/essays/EssayWorkspace";

export default function EssaysPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-gray-500">Loading essay workspace…</p>
        </div>
      }
    >
      <EssayWorkspace />
    </Suspense>
  );
}
