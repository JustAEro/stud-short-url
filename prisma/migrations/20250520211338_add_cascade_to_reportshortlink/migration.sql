-- DropForeignKey
ALTER TABLE "ReportShortLink" DROP CONSTRAINT "ReportShortLink_reportId_fkey";

-- AddForeignKey
ALTER TABLE "ReportShortLink" ADD CONSTRAINT "ReportShortLink_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
