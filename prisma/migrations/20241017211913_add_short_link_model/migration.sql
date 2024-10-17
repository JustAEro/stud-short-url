-- CreateTable
CREATE TABLE "ShortLink" (
    "id" TEXT NOT NULL,
    "longLink" TEXT NOT NULL,
    "shortKey" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_shortKey_key" ON "ShortLink"("shortKey");

-- AddForeignKey
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
