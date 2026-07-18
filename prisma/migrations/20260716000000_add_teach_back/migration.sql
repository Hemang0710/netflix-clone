-- CreateTable
CREATE TABLE "TeachBackSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "conceptMasteryId" INTEGER,
    "concept" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'beginner',
    "explanation" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "completeness" INTEGER NOT NULL,
    "simplicity" INTEGER NOT NULL,
    "feedback" TEXT,
    "gaps" TEXT,
    "jargon" TEXT,
    "followUp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeachBackSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeachBackSession_userId_createdAt_idx" ON "TeachBackSession"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TeachBackSession" ADD CONSTRAINT "TeachBackSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachBackSession" ADD CONSTRAINT "TeachBackSession_conceptMasteryId_fkey" FOREIGN KEY ("conceptMasteryId") REFERENCES "ConceptMastery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
