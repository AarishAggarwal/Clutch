import { NextResponse } from "next/server";
import { getUniversities } from "@/server/universities/universityService";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const control = searchParams.get("control") ?? undefined;
  const state = searchParams.get("state");
  const costMax = searchParams.get("costMax");
  const acceptanceMax = searchParams.get("acceptanceMax");
  const housingOnly = searchParams.get("housingOnly") === "1";
  const sort = (searchParams.get("sort") ?? "alphabetical") as
    | "alphabetical"
    | "lowest_cost"
    | "highest_selectivity"
    | "highest_graduation";

  const universities = await getUniversities({
    q,
    state: state ?? undefined,
    control,
    costMax: costMax ? Number(costMax) : undefined,
    acceptanceMax: acceptanceMax ? Number(acceptanceMax) : undefined,
    housingOnly,
    sort,
  });

  return NextResponse.json({ universities });
}
