-- CreateTable
CREATE TABLE "InboxItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'article',
    "url" TEXT,
    "title" TEXT,
    "siteName" TEXT,
    "rawText" TEXT,
    "summary" TEXT,
    "concepts" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "InboxItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ConceptMastery" ADD COLUMN "inboxItemId" INTEGER;

-- CreateIndex
CREATE INDEX "InboxItem_userId_status_idx" ON "InboxItem"("userId", "status");
CREATE INDEX "InboxItem_userId_createdAt_idx" ON "InboxItem"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ConceptMastery_userId_dueDate_idx" ON "ConceptMastery"("userId", "dueDate");

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptMastery" ADD CONSTRAINT "ConceptMastery_inboxItemId_fkey" FOREIGN KEY ("inboxItemId") REFERENCES "InboxItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
