import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek } from "date-fns";
import { normalizeDate } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const families = await prisma.prayerFamily.findMany({
      include: {
        _count: { select: { users: true } },
        users: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const weekStart = startOfWeek(normalizeDate(now), { weekStartsOn: 1 });

    const assignments = await prisma.familyWeeklyAssignment.findMany({
      where: {
        weekStart: { gte: weekStart },
      },
      take: 4,
      orderBy: { weekStart: "asc" },
      include: {
        prayerFamily: true,
        schedules: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        dayThemes: { orderBy: { date: "asc" } },
      },
    });

    const currentAssignment = await prisma.familyWeeklyAssignment.findUnique({
      where: { weekStart },
      include: {
        prayerFamily: true,
        schedules: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        dayThemes: { orderBy: { date: "asc" } },
      },
    });

    const myNightSchedules = await prisma.familySchedule.findMany({
      where: {
        userId,
        date: { gte: startOfDay(now) },
      },
      orderBy: { date: "asc" },
      take: 5,
      include: { assignment: { include: { prayerFamily: true } } },
    });

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { prayerFamilyId: true },
    });

    return NextResponse.json({
      families,
      assignments,
      currentAssignment,
      myNightSchedules,
      myFamilyId: me?.prayerFamilyId ?? null,
    });
  } catch (error) {
    console.error("[MOBILE_PRAYER_HOUSE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
