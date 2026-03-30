import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, addDays } from "date-fns";
import { normalizeDate } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "LEADER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const tomorrow = addDays(now, 1);
    const tomorrowStart = startOfDay(tomorrow);
    const weekStart = startOfWeek(normalizeDate(now), { weekStartsOn: 1 });

    const activeIntercessors = await prisma.user.count({
      where: { role: { in: ["INTERCESSOR", "LEADER", "PRAYER_LEADER"] } },
    });

    const totalFamilies = await prisma.prayerFamily.count();

    const pendingRoleRequests = await prisma.roleRequest.count({
      where: { status: "PENDING" },
    });

    const nextEvent = await prisma.specialEvent.findFirst({
      where: { startDate: { gte: startOfDay(now) } },
      orderBy: { startDate: "asc" },
    });

    const nightWatch = await prisma.familyWeeklyAssignment.findUnique({
      where: { weekStart },
      include: {
        prayerFamily: true,
        schedules: {
          where: { date: tomorrowStart },
          orderBy: { startTime: "asc" },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    const recentCheckIns = await prisma.checkIn.findMany({
      where: { healthStatus: { in: ["ORANGE", "RED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    const pendingTestimonies = await prisma.testimony.count({
      where: { status: "PENDING" },
    });

    const pendingPrayers = await prisma.prayer.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({
      stats: {
        activeIntercessors,
        totalFamilies,
        pendingRoleRequests,
        pendingTestimonies,
        pendingPrayers,
      },
      nextEvent,
      nightWatch,
      recentCheckIns,
    });
  } catch (error) {
    console.error("[MOBILE_LEADER_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
