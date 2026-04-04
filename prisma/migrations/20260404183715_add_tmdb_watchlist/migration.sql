/*
  Warnings:

  - A unique constraint covering the columns `[profileId,tmdbId]` on the table `Watchlist` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `posterPath` to the `Watchlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Watchlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tmdbId` to the `Watchlist` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Watchlist" DROP CONSTRAINT "Watchlist_movieId_fkey";

-- DropIndex
DROP INDEX "Watchlist_profileId_movieId_key";

-- AlterTable
ALTER TABLE "Watchlist" ADD COLUMN     "posterPath" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "tmdbId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_profileId_tmdbId_key" ON "Watchlist"("profileId", "tmdbId");
