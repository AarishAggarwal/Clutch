import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

const LOCKER_CATEGORY = "Locker";
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export async function GET() {
  const docs = await prisma.document.findMany({
    where: { category: LOCKER_CATEGORY },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ files: docs });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 8MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const payload = JSON.stringify({
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      data: base64,
      uploadedAt: new Date().toISOString(),
    });

    const doc = await prisma.document.create({
      data: {
        title: file.name,
        category: LOCKER_CATEGORY,
        content: payload,
        tags: JSON.stringify(["locker", "upload", file.type || "unknown"]),
      },
    });
    return NextResponse.json({ file: doc }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Upload failed.", details: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}

