import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarketplaceApplication } from "@/lib/marketplaceCatalog";
import { verifyUnlockToken, unlockCookieName } from "@/lib/marketplaceUnlock";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applicationId = new URL(req.url).searchParams.get("applicationId");
  if (!applicationId || !getMarketplaceApplication(applicationId)) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const token = cookies().get(unlockCookieName(applicationId))?.value;
  const unlocked = token ? verifyUnlockToken(token, session.user.id, applicationId) : false;

  return NextResponse.json({ applicationId, unlocked });
}
