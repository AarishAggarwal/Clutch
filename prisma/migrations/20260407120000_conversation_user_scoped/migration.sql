-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'essay_review',
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Conversation_userId_kind_updatedAt_idx" ON "Conversation"("userId", "kind", "updatedAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
