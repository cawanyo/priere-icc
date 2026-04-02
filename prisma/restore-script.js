const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restore(backupFile) {
  if (!backupFile) {
    const files = fs.readdirSync(__dirname)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse();
    if (!files.length) {
      console.error('No backup file found.');
      process.exit(1);
    }
    backupFile = files[0];
    console.log(`Using latest backup: ${backupFile}`);
  }

  const backupPath = path.join(__dirname, backupFile);
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  const { data } = backup;

  console.log(`Restoring from backup exported at: ${backup.exportedAt}`);
  console.log('Clearing existing data...');

  await prisma.$transaction([
    prisma.checkIn.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.appointmentSlot.deleteMany(),
    prisma.familyDayTheme.deleteMany(),
    prisma.familySchedule.deleteMany(),
    prisma.familyWeeklyAssignment.deleteMany(),
    prisma.blackList.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.roleRequest.deleteMany(),
    prisma.unavailability.deleteMany(),
    prisma.testimonyImage.deleteMany(),
    prisma.testimony.deleteMany(),
    prisma.prayer.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
  ]);

  await prisma.$executeRaw`DELETE FROM "_PlanningToUser"`;
  await prisma.planning.deleteMany();
  await prisma.eventTemplate.deleteMany();
  await prisma.specialEvent.deleteMany();
  await prisma.recurringSchedule.deleteMany();

  await prisma.user.deleteMany();
  await prisma.prayerFamily.deleteMany();

  console.log('Restoring PrayerFamilies...');
  for (const r of (data.prayerFamilies || [])) {
    await prisma.prayerFamily.create({ data: r });
  }

  console.log('Restoring Users...');
  for (const r of (data.users || [])) {
    const { prayerFamilyId, ...rest } = r;
    await prisma.user.create({
      data: {
        ...rest,
        ...(prayerFamilyId ? { prayerFamily: { connect: { id: prayerFamilyId } } } : {}),
      },
    });
  }

  console.log('Restoring Accounts...');
  for (const r of (data.accounts || [])) {
    await prisma.account.create({ data: r });
  }

  console.log('Restoring Sessions...');
  for (const r of (data.sessions || [])) {
    await prisma.session.create({ data: r });
  }

  console.log('Restoring PasswordResetTokens...');
  for (const r of (data.passwordResetTokens || [])) {
    await prisma.passwordResetToken.create({ data: r });
  }

  console.log('Restoring Prayers...');
  for (const r of (data.prayers || [])) {
    await prisma.prayer.create({ data: r });
  }

  console.log('Restoring RoleRequests...');
  for (const r of (data.roleRequests || [])) {
    await prisma.roleRequest.create({ data: r });
  }

  console.log('Restoring Unavailabilities...');
  for (const r of (data.unavailabilities || [])) {
    await prisma.unavailability.create({ data: r });
  }

  console.log('Restoring SpecialEvents...');
  for (const r of (data.specialEvents || [])) {
    await prisma.specialEvent.create({ data: r });
  }

  console.log('Restoring EventTemplates...');
  for (const r of (data.eventTemplates || [])) {
    await prisma.eventTemplate.create({ data: r });
  }

  console.log('Restoring Plannings...');
  for (const r of (data.plannings || [])) {
    const { users, intercessors, ...rest } = r;
    const userIds = (users || intercessors || []).map(u => ({ id: u.id }));
    await prisma.planning.create({
      data: {
        ...rest,
        users: userIds.length ? { connect: userIds } : undefined,
      },
    });
  }

  console.log('Restoring RecurringSchedules...');
  for (const r of (data.recurringSchedules || [])) {
    await prisma.recurringSchedule.create({ data: r });
  }

  console.log('Restoring Testimonies...');
  for (const r of (data.testimonies || [])) {
    await prisma.testimony.create({ data: r });
  }

  console.log('Restoring TestimonyImages...');
  for (const r of (data.testimonyImages || [])) {
    await prisma.testimonyImage.create({ data: r });
  }

  console.log('Restoring Notifications...');
  for (const r of (data.notifications || [])) {
    await prisma.notification.create({ data: r });
  }

  console.log('Restoring FamilyWeeklyAssignments...');
  for (const r of (data.familyWeeklyAssignments || [])) {
    await prisma.familyWeeklyAssignment.create({ data: r });
  }

  console.log('Restoring FamilySchedules...');
  for (const r of (data.familySchedules || [])) {
    await prisma.familySchedule.create({ data: r });
  }

  console.log('Restoring FamilyDayThemes...');
  for (const r of (data.familyDayThemes || [])) {
    await prisma.familyDayTheme.create({ data: r });
  }

  console.log('Restoring BlackList...');
  for (const r of (data.blackList || [])) {
    await prisma.blackList.create({ data: r });
  }

  console.log('Restoring CheckIns...');
  for (const r of (data.checkIns || [])) {
    await prisma.checkIn.create({ data: r });
  }

  console.log('Restoring AppointmentSlots...');
  for (const r of (data.appointmentSlots || [])) {
    await prisma.appointmentSlot.create({ data: r });
  }

  console.log('Restoring Appointments...');
  for (const r of (data.appointments || [])) {
    await prisma.appointment.create({ data: r });
  }

  console.log('\nRestore complete!');
}

const backupFile = process.argv[2];
restore(backupFile)
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
