import { Suspense } from "react";
import EssaysClient from "./EssaysClient";

export default function EssaysPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full overflow-y-auto">
          <div className="page-wrap p-6">
            <p className="section-meta">Loading essay workspace…</p>
          </div>
        </div>
      }
    >
      <EssaysClient />
    </Suspense>
  );
}
