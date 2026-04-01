import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    OPENAI_API_KEY_present: Boolean(process.env.OPENAI_API_KEY),
    OPENAI_API_KEY_length: process.env.OPENAI_API_KEY?.length ?? 0,
    ANTHROPIC_API_KEY_present: Boolean(process.env.ANTHROPIC_API_KEY),
    ANTHROPIC_API_KEY_length: process.env.ANTHROPIC_API_KEY?.length ?? 0,
    OPENAI_EVAL_MODEL: process.env.OPENAI_EVAL_MODEL ?? null,
    ANTHROPIC_EVAL_MODEL: process.env.ANTHROPIC_EVAL_MODEL ?? null,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? null,
  });
}

