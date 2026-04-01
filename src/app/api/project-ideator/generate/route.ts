import { NextResponse } from "next/server";
import { z } from "zod";
import { IDEA_MODES, normalizeIntakeProfile, normalizeIdeaFilters, type IdeaModeId } from "@/lib/projectIdeator/types";
import { generateProjectIdeas } from "@/server/projectIdeator/generateIdeas";

const bodySchema = z.object({
  profile: z.record(z.string(), z.unknown()).optional(),
  mode: z.string(),
  filters: z.record(z.string(), z.unknown()).optional(),
  ideaCount: z.number().min(1).max(7).optional().default(5),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
  userMessage: z.string().optional().default(""),
});

const allowedModes = new Set<IdeaModeId>(IDEA_MODES.map((m) => m.id));

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body.", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { mode, ideaCount, messages, userMessage } = parsed.data;
    if (!allowedModes.has(mode as IdeaModeId)) {
      return NextResponse.json({ error: "Invalid generation mode.", validModes: IDEA_MODES.map((m) => m.id) }, { status: 400 });
    }

    const profile = normalizeIntakeProfile((parsed.data.profile ?? {}) as Record<string, unknown>);
    const filters = normalizeIdeaFilters((parsed.data.filters ?? {}) as Record<string, unknown>);

    const { response, modelName } = await generateProjectIdeas({
      profile,
      mode: mode as IdeaModeId,
      filters,
      ideaCount,
      messages,
      userMessage: userMessage.trim() || "Generate project ideas from my profile and constraints.",
    });

    return NextResponse.json({
      ok: true,
      modelName,
      assistantReply: response.assistantReply,
      ideas: response.ideas,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Project ideator generation failed.", details: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
