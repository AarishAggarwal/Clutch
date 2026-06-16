import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    GROQ_API_KEY_present: Boolean(process.env.GROQ_API_KEY),
    GROQ_API_KEY_length: process.env.GROQ_API_KEY?.length ?? 0,
    GEMINI_API_KEY_present: Boolean(process.env.GEMINI_API_KEY),
    GEMINI_API_KEY_length: process.env.GEMINI_API_KEY?.length ?? 0,
    GROQ_ESSAY_MODEL: process.env.GROQ_ESSAY_MODEL ?? null,
    GEMINI_ESSAY_MODEL: process.env.GEMINI_ESSAY_MODEL ?? null,
    GEMINI_SUMMARY_MODEL: process.env.GEMINI_SUMMARY_MODEL ?? null,
    GROQ_BASE_URL: process.env.GROQ_BASE_URL ?? null,
  });
}

