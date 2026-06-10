-- Counselor portal tables (additive — student models unchanged)

CREATE TABLE "CounselorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organization" TEXT,
    "bio" TEXT,
    "specialisations" TEXT NOT NULL DEFAULT '',
    "yearsExperience" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "maxStudents" INTEGER NOT NULL DEFAULT 30,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounselorProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CounselorStudentLink" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounselorStudentLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiSummary" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "generatedById" TEXT,
    "summaryJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSummary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CounselorNote" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "topics" TEXT,
    "actionItems" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounselorNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CounselorProfile_userId_key" ON "CounselorProfile"("userId");
CREATE INDEX "CounselorStudentLink_counselorId_idx" ON "CounselorStudentLink"("counselorId");
CREATE INDEX "CounselorStudentLink_studentProfileId_idx" ON "CounselorStudentLink"("studentProfileId");
CREATE UNIQUE INDEX "CounselorStudentLink_counselorId_studentProfileId_key" ON "CounselorStudentLink"("counselorId", "studentProfileId");
CREATE INDEX "AiSummary_studentProfileId_createdAt_idx" ON "AiSummary"("studentProfileId", "createdAt");
CREATE INDEX "CounselorNote_counselorId_studentProfileId_idx" ON "CounselorNote"("counselorId", "studentProfileId");

ALTER TABLE "CounselorProfile" ADD CONSTRAINT "CounselorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CounselorStudentLink" ADD CONSTRAINT "CounselorStudentLink_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "CounselorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CounselorStudentLink" ADD CONSTRAINT "CounselorStudentLink_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiSummary" ADD CONSTRAINT "AiSummary_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiSummary" ADD CONSTRAINT "AiSummary_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "CounselorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CounselorNote" ADD CONSTRAINT "CounselorNote_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "CounselorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CounselorNote" ADD CONSTRAINT "CounselorNote_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
