-- CreateEnum
CREATE TYPE "TimeScale" AS ENUM ('hour', 'day', 'month');

-- CreateEnum
CREATE TYPE "ChartType" AS ENUM ('line', 'bar');

-- CreateEnum
CREATE TYPE "PredefinedPeriod" AS ENUM ('last24h', 'last7d', 'last30d', 'last365d', 'allTime', 'custom');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "chartType" "ChartType" NOT NULL DEFAULT 'line',
ADD COLUMN     "customEnd" TIMESTAMPTZ(6),
ADD COLUMN     "customStart" TIMESTAMPTZ(6),
ADD COLUMN     "periodType" "PredefinedPeriod" NOT NULL DEFAULT 'allTime',
ADD COLUMN     "timeScale" "TimeScale" NOT NULL DEFAULT 'day';
