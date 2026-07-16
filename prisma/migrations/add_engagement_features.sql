-- Add active learner tracking for real-time activity
CREATE TABLE IF NOT EXISTS "ActiveLearner" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "contentId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("contentId") REFERENCES "Content"(id) ON DELETE CASCADE,
    UNIQUE("userId", "contentId")
);

-- Add quiz challenges for competition
CREATE TABLE IF NOT EXISTS "QuizChallenge" (
    id VARCHAR(36) PRIMARY KEY,
    "contentId" INTEGER NOT NULL,
    "challengerId" INTEGER NOT NULL,
    "challengedUserIds" TEXT[], -- JSON array of user IDs
    "leaderboardMode" BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    FOREIGN KEY ("contentId") REFERENCES "Content"(id) ON DELETE CASCADE,
    FOREIGN KEY ("challengerId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Track challenge participants and their scores
CREATE TABLE IF NOT EXISTS "QuizChallengeParticipant" (
    id SERIAL PRIMARY KEY,
    "challengeId" VARCHAR(36),
    "userId" INTEGER NOT NULL,
    score INTEGER,
    "timeSeconds" INTEGER,
    "attemptedAt" TIMESTAMP,
    FOREIGN KEY ("challengeId") REFERENCES "QuizChallenge"(id) ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE("challengeId", "userId")
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_learner_user ON "ActiveLearner"("userId");
CREATE INDEX IF NOT EXISTS idx_active_learner_content ON "ActiveLearner"("contentId");
CREATE INDEX IF NOT EXISTS idx_active_learner_updated ON "ActiveLearner"("updatedAt");
CREATE INDEX IF NOT EXISTS idx_quiz_challenge_content ON "QuizChallenge"("contentId");
CREATE INDEX IF NOT EXISTS idx_quiz_challenge_challenger ON "QuizChallenge"("challengerId");
CREATE INDEX IF NOT EXISTS idx_quiz_challenge_expires ON "QuizChallenge"("expiresAt");
CREATE INDEX IF NOT EXISTS idx_challenge_participant_user ON "QuizChallengeParticipant"("userId");
CREATE INDEX IF NOT EXISTS idx_challenge_participant_score ON "QuizChallengeParticipant"(score DESC);
