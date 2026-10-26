-- AlterTable
ALTER TABLE "EventTemplate" ADD COLUMN     "daysMode" TEXT NOT NULL DEFAULT 'ALL',
ADD COLUMN     "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "specificDates" TEXT[] DEFAULT ARRAY[]::TEXT[];
