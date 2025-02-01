-- DropForeignKey
ALTER TABLE "EditPermission" DROP CONSTRAINT "EditPermission_shortLinkId_fkey";

-- AddForeignKey
ALTER TABLE "EditPermission" ADD CONSTRAINT "EditPermission_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
