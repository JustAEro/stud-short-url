/*
  Warnings:

  - A unique constraint covering the columns `[userId,shortLinkId]` on the table `EditPermission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role` to the `EditPermission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PermissionRole" AS ENUM ('viewer', 'editor', 'admin');

-- AlterTable
ALTER TABLE "EditPermission" ADD COLUMN "role" "PermissionRole" NOT NULL DEFAULT 'editor';

-- CreateIndex
CREATE UNIQUE INDEX "EditPermission_userId_shortLinkId_key" ON "EditPermission"("userId", "shortLinkId");

UPDATE "EditPermission" ep
SET "role" = 'admin'
FROM "ShortLink" sl
WHERE ep."shortLinkId" = sl."id"
  AND ep."userId" = sl."createdByUserId";

ALTER TABLE "EditPermission" ALTER COLUMN "role" DROP DEFAULT;

