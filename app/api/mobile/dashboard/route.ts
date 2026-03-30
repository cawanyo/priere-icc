import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek } from "date-fns";
import { normalizeDate } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { prayerFamily: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const daySchedules = await prisma.planning.findMany({
      where: { 
          users: { some: { id: user.id } },
          date: { gte: startOfDay(now) }
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: { eventTemplate: true }
    });

    const nightSchedules = await prisma.familySchedule.findMany({
      where: {
          userId: user.id,
          date: { gte: startOfDay(now) }
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: { assignment: { include: { prayerFamily: true } } }
    });

    // Stats
    const dayServicesThisMonth = await prisma.planning.count({
      where: {
        users: { some: { id: user.id } },
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    const nightServicesThisMonth = await prisma.familySchedule.count({
      where: {
        userId: user.id,
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    // Upcoming Events
    const upcomingEvents = await prisma.specialEvent.findMany({
      where: { startDate: { gte: startOfDay(now) } },
      orderBy: { startDate: 'asc' },
      take: 3
    });

    // Recent Testimonies
    const recentTestimonies = await prisma.testimony.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { user: { select: { name: true, image: true } }, images: true }
    });

    // Current Night Watch
    const weekStart = startOfWeek(normalizeDate(now), { weekStartsOn: 1 });
    const currentNightWatch = await prisma.familyWeeklyAssignment.findUnique({
      where: { weekStart },
      include: {
        prayerFamily: true,
        schedules: {
          where: { date: startOfDay(now) },
          include: { user: true },
          orderBy: { startTime: 'asc' }
        }
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        image: user.image,
        prayerFamily: user.prayerFamily
      },
      daySchedules,
      nightSchedules,
      servicesThisMonth: dayServicesThisMonth + nightServicesThisMonth,
      upcomingEvents,
      recentTestimonies,
      currentNightWatch
    });
  } catch (error) {
    console.error("Mobile API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
