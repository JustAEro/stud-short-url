-- DropForeignKey
ALTER TABLE "ReportShortLink" DROP CONSTRAINT "ReportShortLink_shortLinkId_fkey";

-- AddForeignKey
ALTER TABLE "ReportShortLink" ADD CONSTRAINT "ReportShortLink_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
