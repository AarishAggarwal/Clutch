import { NextResponse } from "next/server";
import { z } from "zod";
import { getCounselorReply } from "@/server/fourYearCounselorService";

const reqSchema = z.object({
  message: z.string().min(1),
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
    const body = await req.json().catch(() => null);
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body.", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { reply, modelName } = await getCounselorReply({
      userMessage: parsed.data.message.trim(),
      history: parsed.data.history,
    });

    return NextResponse.json({ ok: true, reply, modelName });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Counselor chat failed.", details: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}

