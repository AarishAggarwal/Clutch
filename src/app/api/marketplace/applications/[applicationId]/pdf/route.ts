import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarketplaceApplication } from "@/lib/marketplaceCatalog";
import { resolveApplicationPdfPath, verifyUnlockToken, unlockCookieName } from "@/lib/marketplaceUnlock";

type Ctx = { params: { applicationId: string } };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const application = getMarketplaceApplication(ctx.params.applicationId);
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const token = cookies().get(unlockCookieName(application.id))?.value;
  const unlocked = token ? verifyUnlockToken(token, session.user.id, application.id) : false;
  if (!unlocked) {
    return NextResponse.json({ error: "Purchase required to view full application." }, { status: 403 });
  }

  try {
    const filePath = resolveApplicationPdfPath(application.pdfPath);
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${application.id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Application file is not available." }, { status: 404 });
  }
}
