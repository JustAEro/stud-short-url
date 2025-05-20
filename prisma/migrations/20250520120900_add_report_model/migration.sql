-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportShortLink" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "shortLinkId" TEXT NOT NULL,

    CONSTRAINT "ReportShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "role" "PermissionRole" NOT NULL,

    CONSTRAINT "ReportPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportShortLink_reportId_shortLinkId_key" ON "ReportShortLink"("reportId", "shortLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportPermission_userId_reportId_key" ON "ReportPermission"("userId", "reportId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShortLink" ADD CONSTRAINT "ReportShortLink_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShortLink" ADD CONSTRAINT "ReportShortLink_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportPermission" ADD CONSTRAINT "ReportPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportPermission" ADD CONSTRAINT "ReportPermission_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
