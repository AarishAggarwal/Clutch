ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "richContent" TEXT;
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "plainText" TEXT;
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "promptText" TEXT;
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "universitySlug" TEXT;
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "universityName" TEXT;
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "promptId" TEXT;
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "limitType" TEXT;
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "limitValue" INTEGER;
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "characterCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "pronouns" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "boardSystem" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "academicData" TEXT;

CREATE TABLE "EssayVersion" (
    "id" TEXT NOT NULL,
    "essayId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "richContent" TEXT,
    "wordCount" INTEGER NOT NULL,
    "characterCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "authorRole" TEXT NOT NULL DEFAULT 'student',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EssayVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EssayComment" (
    "id" TEXT NOT NULL,
    "essayId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "anchorStart" INTEGER NOT NULL,
    "anchorEnd" INTEGER NOT NULL,
    "quotedText" TEXT NOT NULL,
    "highlightColor" TEXT NOT NULL DEFAULT '#fef08a',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EssayComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EssayVersion_essayId_createdAt_idx" ON "EssayVersion"("essayId", "createdAt");
CREATE INDEX "EssayComment_essayId_resolved_idx" ON "EssayComment"("essayId", "resolved");
CREATE INDEX "EssayComment_parentId_idx" ON "EssayComment"("parentId");

ALTER TABLE "EssayVersion" ADD CONSTRAINT "EssayVersion_essayId_fkey"
FOREIGN KEY ("essayId") REFERENCES "Essay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EssayComment" ADD CONSTRAINT "EssayComment_essayId_fkey"
FOREIGN KEY ("essayId") REFERENCES "Essay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EssayComment" ADD CONSTRAINT "EssayComment_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "EssayComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
