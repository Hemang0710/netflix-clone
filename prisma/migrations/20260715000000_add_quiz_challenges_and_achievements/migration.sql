-- The engagement tables were previously defined in a loose SQL file
-- (add_engagement_features.sql) that `prisma migrate` never executed, and its
-- column types did not match schema.prisma (TEXT[] vs TEXT). No code could
-- have written to those tables (the generated client would reject the types),
-- so drop any manually-created copies and recreate them to match the schema.
DROP TABLE IF EXISTS "QuizChallengeParticipant";
DROP TABLE IF EXISTS "QuizChallenge";

-- CreateTable
CREATE TABLE "QuizChallenge" (
    "id" TEXT NOT NULL,
    "contentId" INTEGER NOT NULL,
    "challengerId" INTEGER NOT NULL,
    "challengedUserIds" TEXT NOT NULL DEFAULT '[]',
    "leaderboardMode" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizChallengeParticipant" (
    "id" SERIAL NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" INTEGER,
    "timeSeconds" INTEGER,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizChallengeParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizChallenge_contentId_idx" ON "QuizChallenge"("contentId");
CREATE INDEX "QuizChallenge_challengerId_idx" ON "QuizChallenge"("challengerId");
CREATE INDEX "QuizChallenge_expiresAt_idx" ON "QuizChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuizChallengeParticipant_challengeId_userId_key" ON "QuizChallengeParticipant"("challengeId", "userId");
CREATE INDEX "QuizChallengeParticipant_userId_idx" ON "QuizChallengeParticipant"("userId");
CREATE INDEX "QuizChallengeParticipant_score_idx" ON "QuizChallengeParticipant"("score");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_key_key" ON "Achievement"("userId", "key");
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- AddForeignKey
ALTER TABLE "QuizChallenge" ADD CONSTRAINT "QuizChallenge_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizChallenge" ADD CONSTRAINT "QuizChallenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizChallengeParticipant" ADD CONSTRAINT "QuizChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "QuizChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizChallengeParticipant" ADD CONSTRAINT "QuizChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
