-- AlterTable (IF NOT EXISTS: reconciles drift — some environments already
-- received this column via `prisma db push`)
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "helpful" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AutopilotSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "studyDays" TEXT NOT NULL DEFAULT '[1,2,3,4,5]',
    "startHour" INTEGER NOT NULL DEFAULT 18,
    "endHour" INTEGER NOT NULL DEFAULT 21,
    "slotMinutes" INTEGER NOT NULL DEFAULT 25,
    "maxSlotsPerDay" INTEGER NOT NULL DEFAULT 2,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "calendarToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutopilotSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT '[]',
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lastStatus" INTEGER,
    "lastError" TEXT,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutopilotSettings_userId_key" ON "AutopilotSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AutopilotSettings_calendarToken_key" ON "AutopilotSettings"("calendarToken");

-- CreateIndex
CREATE INDEX "Webhook_userId_active_idx" ON "Webhook"("userId", "active");

-- AddForeignKey
ALTER TABLE "AutopilotSettings" ADD CONSTRAINT "AutopilotSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
