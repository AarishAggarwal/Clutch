import { redirect } from "next/navigation";

/** Competition discovery lives under Projects → Competitions for students. */
export default function ActivitiesCompetitionsRedirectPage() {
  redirect("/projects/competitions");
}
