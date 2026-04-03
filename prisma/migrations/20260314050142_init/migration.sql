/*
  Warnings:

  - You are about to drop the column `thumbnaiUrl` on the `Movie` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Movie" DROP COLUMN "thumbnaiUrl",
ADD COLUMN     "thumbnailUrl" TEXT;
