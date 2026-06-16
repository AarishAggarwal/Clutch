import { NextResponse } from "next/server";
import { z } from "zod";
import { getCounselorReply } from "@/server/fourYearCounselorService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const reqSchema = z.object({
  message: z.string().min(1),
  mode: z.enum(["general", "activities"]).optional().default("general"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body.", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { reply, modelName } = await getCounselorReply({
      userMessage: parsed.data.message.trim(),
      history: parsed.data.history,
      userId: session.user.id,
      mode: parsed.data.mode,
    });

    return NextResponse.json({ ok: true, reply, modelName });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Counselor chat failed.", details: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}

