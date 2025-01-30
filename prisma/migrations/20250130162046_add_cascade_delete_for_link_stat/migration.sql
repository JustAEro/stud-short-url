-- DropForeignKey
ALTER TABLE "LinkStat" DROP CONSTRAINT "LinkStat_shortLinkId_fkey";

-- AddForeignKey
ALTER TABLE "LinkStat" ADD CONSTRAINT "LinkStat_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
