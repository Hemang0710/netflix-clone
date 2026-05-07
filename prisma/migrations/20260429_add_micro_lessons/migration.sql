-- CreateTable MicroLesson
CREATE TABLE "MicroLesson" (
    "id" SERIAL NOT NULL,
    "contentId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "concept" TEXT NOT NULL,
    "startTimestamp" DOUBLE PRECISION NOT NULL,
    "endTimestamp" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "videoUrl" TEXT,
    "transcriptSegment" TEXT NOT NULL DEFAULT '',
    "relatedFlashcards" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MicroLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable MicroLessonProgress
CREATE TABLE "MicroLessonProgress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "microLessonId" INTEGER NOT NULL,
    "watched" BOOLEAN NOT NULL DEFAULT false,
    "quizScore" INTEGER,
    "notesAdded" TEXT,
    "watchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MicroLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MicroLesson_contentId_startTimestamp_key" ON "MicroLesson"("contentId", "startTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MicroLessonProgress_userId_microLessonId_key" ON "MicroLessonProgress"("userId", "microLessonId");

-- AddForeignKey
ALTER TABLE "MicroLesson" ADD CONSTRAINT "MicroLesson_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroLessonProgress" ADD CONSTRAINT "MicroLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroLessonProgress" ADD CONSTRAINT "MicroLessonProgress_microLessonId_fkey" FOREIGN KEY ("microLessonId") REFERENCES "MicroLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
