/*
  Warnings:

  - Changed the type of `deviceType` on the `LinkStat` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "LinkStat" DROP COLUMN "deviceType",
ADD COLUMN     "deviceType" TEXT NOT NULL;

-- DropEnum
DROP TYPE "DeviceType";
