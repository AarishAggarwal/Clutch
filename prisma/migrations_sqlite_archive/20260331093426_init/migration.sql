-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EssaySubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "essayType" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    CONSTRAINT "EssaySubmission_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModelEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "essaySubmissionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "rawJson" TEXT NOT NULL,
    "parsedJson" TEXT NOT NULL,
    "validSchema" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModelEvaluation_essaySubmissionId_fkey" FOREIGN KEY ("essaySubmissionId") REFERENCES "EssaySubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FusedEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "essaySubmissionId" TEXT NOT NULL,
    "fusedJson" TEXT NOT NULL,
    "agreementSummary" TEXT NOT NULL,
    "disagreementFlags" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FusedEvaluation_essaySubmissionId_fkey" FOREIGN KEY ("essaySubmissionId") REFERENCES "EssaySubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "EssaySubmission_conversationId_createdAt_idx" ON "EssaySubmission"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "ModelEvaluation_essaySubmissionId_provider_createdAt_idx" ON "ModelEvaluation"("essaySubmissionId", "provider", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FusedEvaluation_essaySubmissionId_key" ON "FusedEvaluation"("essaySubmissionId");
