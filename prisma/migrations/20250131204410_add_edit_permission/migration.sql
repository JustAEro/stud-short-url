-- CreateTable
CREATE TABLE "EditPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shortLinkId" TEXT NOT NULL,

    CONSTRAINT "EditPermission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EditPermission" ADD CONSTRAINT "EditPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditPermission" ADD CONSTRAINT "EditPermission_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
