import { Suspense } from "react";
import ProjectIdeatorStudio from "@/components/projects/ideator/ProjectIdeatorStudio";

export default function ProjectChatbotPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="section-meta">Loading project ideator…</p>
        </div>
      }
    >
      <ProjectIdeatorStudio />
    </Suspense>
  );
}
