"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { startOfDay, endOfDay, addDays, startOfWeek } from "date-fns";
import { normalizeDate } from "@/lib/utils";

// --- DASHBOARD LEADER ---
export async function getLeaderStats() {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  const nextWeek = addDays(today, 7);

  // 1. Prochain événement spécial
  const nextEvent = await prisma.specialEvent.findFirst({
    where: { startDate: { gte: startOfToday } },
    orderBy: { startDate: 'asc' },
    take: 1
  });

  // 2. Sentinelles de la nuit prochaine (00h - 04h de DEMAIN matin si on est le soir, ou CE matin si on est la journée)
  // Simplifions : on regarde la nuit qui arrive (donc date = demain)
  const tomorrow = addDays(today, 1);
  const tomorrowKey = startOfDay(tomorrow); // La date stockée en base pour la nuit est souvent celle du jour même 00:00

  // On cherche l'assignation de la semaine pour demain
  const weekStart = startOfWeek(normalizeDate(tomorrow), { weekStartsOn: 1 });
  
  const nightWatch = await prisma.familyWeeklyAssignment.findUnique({
    where: { weekStart },
    include: {
        family: true,
        schedules: {
            where: { date: tomorrowKey }, // Les créneaux de cette date précise
            include: { user: true },
            orderBy: { startTime: 'asc' }
        }
    }
  });

  // 3. Stats Globales
  const activeIntercessors = await prisma.user.count({ where: { role: "PRAYER_LEADER" } });
  const totalFamilies = await prisma.prayerFamily.count();

  return {
    nextEvent,
    nightWatch, // Contient la famille de garde + les sentinelles de demain
    stats: { activeIntercessors, totalFamilies }
  };
}

// --- DASHBOARD USER ---
export async function getUserDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { prayerFamily: true }
  });

  if (!user) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 1. Prochains services (Planning Jour + Nuit mélangés)
  // A. Planning Jour
  const daySchedules = await prisma.planning.findMany({
    where: { 
        intercessors: { some: { id: user.id } },
        date: { gte: startOfDay(now) }
    },
    orderBy: { date: 'asc' },
    take: 3,
    include: { template: true }
  });

  // B. Planning Nuit
  const nightSchedules = await prisma.familySchedule.findMany({
    where: {
        userId: user.id,
        date: { gte: startOfDay(now) }
    },
    orderBy: { date: 'asc' },
    take: 3,
    include: { assignment: { include: { family: true } } }
  });

  // C. Nombre de services ce mois
  const dayServicesThisMonth = await prisma.planning.count({
    where: {
      intercessors: { some: { id: user.id } },
      date: { gte: startOfMonth, lte: endOfMonth }
    }
  });

  const nightServicesThisMonth = await prisma.familySchedule.count({
    where: {
      userId: user.id,
      date: { gte: startOfMonth, lte: endOfMonth }
    }
  });

  const servicesThisMonth = dayServicesThisMonth + nightServicesThisMonth;

  // D. Prochains événements (les 2 prochains)
  const upcomingEvents = await prisma.specialEvent.findMany({
    where: { startDate: { gte: startOfDay(now) } },
    orderBy: { startDate: 'asc' },
    take: 2
  });

  // E. Témoignages récents approuvés (les 3 derniers)
  const recentTestimonies = await prisma.testimony.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { user: { select: { name: true, image: true } }, images: true }
  });

  // F. Maison de garde cette semaine
  const weekStart = startOfWeek(normalizeDate(now), { weekStartsOn: 1 });
  const currentNightWatch = await prisma.familyWeeklyAssignment.findUnique({
    where: { weekStart },
    include: {
      family: true,
      schedules: {
        where: { date: startOfDay(now) },
        include: { user: true },
        orderBy: { startTime: 'asc' }
      }
    }
  });

  return {
    user,
    daySchedules,
    nightSchedules,
    servicesThisMonth,
    upcomingEvents,
    recentTestimonies,
    currentNightWatch
  };
}