-- Baseline schema for PostgreSQL (e.g. Supabase). Prior SQLite migrations are archived under prisma/migrations_sqlite_archive/.

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EssaySubmission" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "essayType" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "supplementalUniversityId" TEXT,
    "supplementalUniversityName" TEXT,
    "supplementalPromptId" TEXT,
    "supplementalPromptQuestion" TEXT,
    "supplementalPromptCycleYear" TEXT,

    CONSTRAINT "EssaySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelEvaluation" (
    "id" TEXT NOT NULL,
    "essaySubmissionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "rawJson" TEXT NOT NULL,
    "parsedJson" TEXT NOT NULL,
    "validSchema" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FusedEvaluation" (
    "id" TEXT NOT NULL,
    "essaySubmissionId" TEXT NOT NULL,
    "fusedJson" TEXT NOT NULL,
    "agreementSummary" TEXT NOT NULL,
    "disagreementFlags" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FusedEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "control" TEXT,
    "level" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "logoSource" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "applicationFee" INTEGER,
    "tuitionInState" INTEGER,
    "tuitionOutOfState" INTEGER,
    "averageAnnualCost" INTEGER,
    "housingAvailable" BOOLEAN,
    "housingCost" INTEGER,
    "campusSetting" TEXT,
    "acceptanceRate" DOUBLE PRECISION,
    "graduationRate" DOUBLE PRECISION,
    "medianEarnings" INTEGER,
    "undergradEnrollment" INTEGER,
    "totalEnrollment" INTEGER,
    "satReading25" INTEGER,
    "satReading75" INTEGER,
    "satMath25" INTEGER,
    "satMath75" INTEGER,
    "act25" INTEGER,
    "act75" INTEGER,
    "testingPolicy" TEXT,
    "admissionsDeadlineED" TEXT,
    "admissionsDeadlineEA" TEXT,
    "admissionsDeadlineRD" TEXT,
    "popularMajors" TEXT,
    "notes" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "sourceCoreName" TEXT,
    "sourceAdmissionsName" TEXT,
    "sourceBrandName" TEXT,
    "sourceCoreUrl" TEXT,
    "sourceAdmissionsUrl" TEXT,
    "sourceBrandUrl" TEXT,
    "rawSourcePayload" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Essay" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "essayType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "notes" TEXT,
    "draft" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Essay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "grades" TEXT NOT NULL,
    "hoursPerWeek" DOUBLE PRECISION NOT NULL,
    "weeksPerYear" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "achievementNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "fullName" TEXT,
    "graduationYear" INTEGER,
    "schoolName" TEXT,
    "gpa" DOUBLE PRECISION,
    "sat" INTEGER,
    "act" INTEGER,
    "intendedMajors" TEXT NOT NULL,
    "courseworkSummary" TEXT,
    "location" TEXT,
    "interests" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EssaySubmission" ADD CONSTRAINT "EssaySubmission_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelEvaluation" ADD CONSTRAINT "ModelEvaluation_essaySubmissionId_fkey" FOREIGN KEY ("essaySubmissionId") REFERENCES "EssaySubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FusedEvaluation" ADD CONSTRAINT "FusedEvaluation_essaySubmissionId_fkey" FOREIGN KEY ("essaySubmissionId") REFERENCES "EssaySubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "EssaySubmission_conversationId_createdAt_idx" ON "EssaySubmission"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "ModelEvaluation_essaySubmissionId_provider_createdAt_idx" ON "ModelEvaluation"("essaySubmissionId", "provider", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FusedEvaluation_essaySubmissionId_key" ON "FusedEvaluation"("essaySubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "University_externalId_key" ON "University"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "University_slug_key" ON "University"("slug");
