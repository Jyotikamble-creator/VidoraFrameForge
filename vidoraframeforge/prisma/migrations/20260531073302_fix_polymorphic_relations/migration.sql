/*
  Warnings:

  - Changed the type of `contentType` on the `Comment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `contentType` on the `Like` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'PHOTO', 'JOURNAL');

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_journal_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_photo_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_video_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_journal_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_photo_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_video_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "contentType",
ADD COLUMN     "contentType" "ContentType" NOT NULL;

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "contentType",
ADD COLUMN     "contentType" "ContentType" NOT NULL;

-- CreateIndex
CREATE INDEX "Comment_contentType_contentId_idx" ON "Comment"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "Like_contentType_contentId_idx" ON "Like"("contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_contentType_contentId_key" ON "Like"("userId", "contentType", "contentId");
