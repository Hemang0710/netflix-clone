-- CreateTable
CREATE TABLE "ProjectBrief" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clusterKey" TEXT NOT NULL,
    "clusterLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pitch" TEXT NOT NULL,
    "deliverable" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'starter',
    "estimatedHours" INTEGER,
    "concepts" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCheckpoint" (
    "id" SERIAL NOT NULL,
    "briefId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "acceptance" TEXT NOT NULL,
    "hint" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submission" TEXT,
    "feedback" TEXT,
    "score" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "passedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectBrief_userId_status_idx" ON "ProjectBrief"("userId", "status");

-- CreateIndex
CREATE INDEX "ProjectCheckpoint_briefId_order_idx" ON "ProjectCheckpoint"("briefId", "order");

-- AddForeignKey
ALTER TABLE "ProjectBrief" ADD CONSTRAINT "ProjectBrief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCheckpoint" ADD CONSTRAINT "ProjectCheckpoint_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "ProjectBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
