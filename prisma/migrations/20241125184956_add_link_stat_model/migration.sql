-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET', 'OTHER');

-- AlterTable
ALTER TABLE "ShortLink" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "LinkStat" (
    "id" TEXT NOT NULL,
    "shortLinkId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT,
    "deviceType" "DeviceType" NOT NULL,
    "browser" TEXT NOT NULL,
    "referrer" TEXT,

    CONSTRAINT "LinkStat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LinkStat" ADD CONSTRAINT "LinkStat_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
