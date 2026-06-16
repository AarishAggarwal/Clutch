-- Counselor public feedback + student notifications

CREATE TABLE "CounselorFeedback" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'student',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounselorFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CounselorFeedback_studentProfileId_targetType_targetId_createdAt_idx"
ON "CounselorFeedback"("studentProfileId", "targetType", "targetId", "createdAt");

CREATE INDEX "CounselorFeedback_userId_targetType_targetId_createdAt_idx"
ON "CounselorFeedback"("userId", "targetType", "targetId", "createdAt");

CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

ALTER TABLE "CounselorFeedback"
ADD CONSTRAINT "CounselorFeedback_counselorId_fkey"
FOREIGN KEY ("counselorId") REFERENCES "CounselorProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CounselorFeedback"
ADD CONSTRAINT "CounselorFeedback_studentProfileId_fkey"
FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
