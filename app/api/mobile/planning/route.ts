import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const mySchedules = await prisma.planning.findMany({
      where: {
        users: { some: { id: userId } },
        date: { gte: startOfDay(now) },
      },
      orderBy: { date: "asc" },
      take: 20,
      include: { eventTemplate: true, users: { select: { id: true, name: true, image: true } } },
    });

    const thisWeekSchedules = await prisma.planning.findMany({
      where: {
        date: { gte: weekStart, lte: weekEnd },
        specialEventId: null,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: { users: { select: { id: true, name: true, image: true } } },
    });

    const myNightSchedules = await prisma.familySchedule.findMany({
      where: {
        userId,
        date: { gte: startOfDay(now) },
      },
      orderBy: { date: "asc" },
      take: 10,
      include: { assignment: { include: { prayerFamily: true } } },
    });

    const upcomingEvents = await prisma.specialEvent.findMany({
      where: { startDate: { gte: startOfDay(now) } },
      orderBy: { startDate: "asc" },
      take: 5,
      include: { eventTemplates: true },
    });

    return NextResponse.json({
      mySchedules,
      thisWeekSchedules,
      myNightSchedules,
      upcomingEvents,
    });
  } catch (error) {
    console.error("[MOBILE_PLANNING_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
