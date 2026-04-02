-- CreateEnum
CREATE TYPE "STATUS" AS ENUM ('PENDING', 'APPROVED', 'REFUSED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PRAYER_LEADER';

-- DropForeignKey
ALTER TABLE "Planning" DROP CONSTRAINT "Planning_specialEventId_fkey";

-- AlterTable
ALTER TABLE "EventTemplate" ALTER COLUMN "startTime" SET DATA TYPE TEXT,
ALTER COLUMN "endTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Planning" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "templateId" TEXT,
ALTER COLUMN "startTime" SET DATA TYPE TEXT,
ALTER COLUMN "endTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RecurringSchedule" ALTER COLUMN "startTime" SET DATA TYPE TEXT,
ALTER COLUMN "endTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RoleRequest" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'INTERCESSOR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "prayerFamilyId" TEXT;

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentSlot" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlackList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hour" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlackList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodMonth" TIMESTAMP(3) NOT NULL,
    "scoreEnergy" INTEGER NOT NULL,
    "scorePeace" INTEGER NOT NULL,
    "scoreJoy" INTEGER NOT NULL,
    "scoreClarity" INTEGER NOT NULL,
    "scoreServiceLoad" INTEGER NOT NULL,
    "alerts" TEXT[],
    "alertOther" TEXT,
    "hadDifficultMoment" BOOLEAN NOT NULL DEFAULT false,
    "difficultMomentText" TEXT,
    "scoreOvergiving" INTEGER NOT NULL,
    "scoreSupportFelt" INTEGER NOT NULL,
    "needsScheduleAdjust" BOOLEAN NOT NULL DEFAULT false,
    "supportNeeds" TEXT[],
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'TEAM',
    "healthScore" INTEGER NOT NULL DEFAULT 0,
    "healthStatus" TEXT NOT NULL DEFAULT 'GREEN',
    "isContacted" BOOLEAN NOT NULL DEFAULT false,
    "leaderNote" TEXT,
    "contactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyDayTheme" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "theme" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,

    CONSTRAINT "FamilyDayTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilySchedule" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyWeeklyAssignment" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "familyId" TEXT NOT NULL,
    "weekTheme" TEXT,

    CONSTRAINT "FamilyWeeklyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#4f46e5',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerFamily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_slotId_key" ON "Appointment"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_userId_periodMonth_key" ON "CheckIn"("userId", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyDayTheme_assignmentId_date_key" ON "FamilyDayTheme"("assignmentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyWeeklyAssignment_weekStart_key" ON "FamilyWeeklyAssignment"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_userId_token_key" ON "PasswordResetToken"("userId", "token");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AppointmentSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyDayTheme" ADD CONSTRAINT "FamilyDayTheme_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "FamilyWeeklyAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilySchedule" ADD CONSTRAINT "FamilySchedule_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "FamilyWeeklyAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilySchedule" ADD CONSTRAINT "FamilySchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyWeeklyAssignment" ADD CONSTRAINT "FamilyWeeklyAssignment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "PrayerFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planning" ADD CONSTRAINT "Planning_specialEventId_fkey" FOREIGN KEY ("specialEventId") REFERENCES "SpecialEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planning" ADD CONSTRAINT "Planning_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EventTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_prayerFamilyId_fkey" FOREIGN KEY ("prayerFamilyId") REFERENCES "PrayerFamily"("id") ON DELETE SET NULL ON UPDATE CASCADE;
