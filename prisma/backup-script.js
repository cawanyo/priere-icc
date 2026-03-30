const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  console.log('Starting backup...');

  const [
    users,
    accounts,
    sessions,
    prayers,
    roleRequests,
    unavailabilities,
    plannings,
    recurringSchedules,
    specialEvents,
    eventTemplates,
    testimonies,
    testimonyImages,
    notifications,
    passwordResetTokens,
    prayerFamilies,
    familyWeeklyAssignments,
    familySchedules,
    familyDayThemes,
    blackList,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.account.findMany(),
    prisma.session.findMany(),
    prisma.prayer.findMany(),
    prisma.roleRequest.findMany(),
    prisma.unavailability.findMany(),
    prisma.planning.findMany({ include: { intercessors: { select: { id: true } } } }),
    prisma.recurringSchedule.findMany(),
    prisma.specialEvent.findMany(),
    prisma.eventTemplate.findMany(),
    prisma.testimony.findMany(),
    prisma.testimonyImage.findMany(),
    prisma.notification.findMany(),
    prisma.passwordResetToken.findMany(),
    prisma.prayerFamily.findMany(),
    prisma.familyWeeklyAssignment.findMany(),
    prisma.familySchedule.findMany(),
    prisma.familyDayTheme.findMany(),
    prisma.blackList.findMany(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    counts: {
      users: users.length,
      accounts: accounts.length,
      sessions: sessions.length,
      prayers: prayers.length,
      roleRequests: roleRequests.length,
      unavailabilities: unavailabilities.length,
      plannings: plannings.length,
      recurringSchedules: recurringSchedules.length,
      specialEvents: specialEvents.length,
      eventTemplates: eventTemplates.length,
      testimonies: testimonies.length,
      testimonyImages: testimonyImages.length,
      notifications: notifications.length,
      passwordResetTokens: passwordResetTokens.length,
      prayerFamilies: prayerFamilies.length,
      familyWeeklyAssignments: familyWeeklyAssignments.length,
      familySchedules: familySchedules.length,
      familyDayThemes: familyDayThemes.length,
      blackList: blackList.length,
    },
    data: {
      users,
      accounts,
      sessions,
      prayers,
      roleRequests,
      unavailabilities,
      plannings,
      recurringSchedules,
      specialEvents,
      eventTemplates,
      testimonies,
      testimonyImages,
      notifications,
      passwordResetTokens,
      prayerFamilies,
      familyWeeklyAssignments,
      familySchedules,
      familyDayThemes,
      blackList,
    },
  };

  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const outPath = path.join(__dirname, filename);
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2));

  console.log(`\nBackup complete: ${filename}`);
  console.log('Record counts:');
  Object.entries(backup.counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

backup()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
