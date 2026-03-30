"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { startOfMonth } from "date-fns";

function computeHealthScore(data: {
  scoreEnergy: number;
  scorePeace: number;
  scoreJoy: number;
  scoreClarity: number;
  scoreServiceLoad: number;
  alerts: string[];
  scoreOvergiving: number;
  scoreSupportFelt: number;
  needsScheduleAdjust: boolean;
}): { score: number; status: "GREEN" | "ORANGE" | "RED" } {
  // Bloc 1 : état global /50
  // Les scores énergie/paix/joie/clarté : plus c'est haut = mieux
  // Charge de service : plus c'est haut = pire → on inverse
  const globalRaw =
    data.scoreEnergy +
    data.scorePeace +
    data.scoreJoy +
    data.scoreClarity +
    (10 - data.scoreServiceLoad);
  const globalScore = Math.round((globalRaw / 50) * 50);

  // Bloc 2 : signaux d'alerte /30 (chaque alerte = -3, max 10 alertes)
  const alertPenalty = Math.min(data.alerts.length * 3, 30);
  const alertScore = 30 - alertPenalty;

  // Bloc 3 : service /20
  // overgiving : plus haut = pire → on inverse
  // supportFelt : plus haut = mieux
  const serviceRaw = (10 - data.scoreOvergiving) + data.scoreSupportFelt;
  let serviceScore = Math.round((serviceRaw / 20) * 20);
  if (data.needsScheduleAdjust) serviceScore = Math.max(0, serviceScore - 5);

  const total = globalScore + alertScore + serviceScore;
  const score = Math.max(0, Math.min(100, total));

  let status: "GREEN" | "ORANGE" | "RED" = "GREEN";
  if (score < 45) status = "RED";
  else if (score < 70) status = "ORANGE";

  return { score, status };
}

export async function submitCheckIn(formData: {
  scoreEnergy: number;
  scorePeace: number;
  scoreJoy: number;
  scoreClarity: number;
  scoreServiceLoad: number;
  alerts: string[];
  alertOther?: string;
  hadDifficultMoment: boolean;
  difficultMomentText?: string;
  scoreOvergiving: number;
  scoreSupportFelt: number;
  needsScheduleAdjust: boolean;
  supportNeeds: string[];
  consentGiven: boolean;
  visibility: string;
  comment?: string;
}) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) throw new Error("Non connecté");
  // @ts-ignore
  const userId = session.user.id as string;

  const periodMonth = startOfMonth(new Date());

  const { score, status } = computeHealthScore(formData);

  await prisma.checkIn.upsert({
    where: { userId_periodMonth: { userId, periodMonth } },
    create: {
      userId,
      periodMonth,
      ...formData,
      healthScore: score,
      healthStatus: status,
    },
    update: {
      ...formData,
      healthScore: score,
      healthStatus: status,
      isContacted: false,
    },
  });

  revalidatePath("/dashboard/mobile/checkin");
  return { success: true, score, status };
}

export async function getMyCheckIn() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) return null;
  // @ts-ignore
  const userId = session.user.id as string;

  const periodMonth = startOfMonth(new Date());

  return prisma.checkIn.findUnique({
    where: { userId_periodMonth: { userId, periodMonth } },
  });
}

export async function getMyCheckInHistory() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) return [];
  // @ts-ignore
  const userId = session.user.id as string;

  return prisma.checkIn.findMany({
    where: { userId },
    orderBy: { periodMonth: "desc" },
    take: 6,
  });
}

export async function getMyCheckInByMonth(year: number, month: number) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) return null;
  // @ts-ignore
  const userId = session.user.id as string;

  const periodMonth = startOfMonth(new Date(year, month - 1, 1));

  return prisma.checkIn.findUnique({
    where: { userId_periodMonth: { userId, periodMonth } },
  });
}

// ── LEADER ACTIONS ──────────────────────────────────────────────

async function checkLeaderAccess() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) throw new Error("Non connecté");
  // @ts-ignore
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["LEADER", "ADMIN"].includes(user.role)) throw new Error("Accès refusé");
  return user;
}

export async function getAllCheckIns(filters?: {
  status?: string;
  alerts?: string[];
  month?: Date;
  userName?: string;
}) {
  await checkLeaderAccess();

  const periodMonth = filters?.month
    ? startOfMonth(filters.month)
    : startOfMonth(new Date());

  const where: any = { periodMonth };
  if (filters?.status && filters.status !== "ALL") {
    where.healthStatus = filters.status;
  }
  if (filters?.alerts && filters.alerts.length > 0) {
    where.alerts = { hasSome: filters.alerts };
  }
  if (filters?.userName) {
    where.user = { name: { contains: filters.userName, mode: "insensitive" } };
  }

  return prisma.checkIn.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, image: true, role: true, prayerFamilyId: true } },
    },
    orderBy: { healthScore: "asc" },
  });
}

export async function getCheckInDetail(checkInId: string) {
  await checkLeaderAccess();
  return prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: {
      user: { select: { id: true, name: true, image: true, role: true, phone: true } },
    },
  });
}

export async function markAsContacted(checkInId: string, note?: string) {
  await checkLeaderAccess();

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      isContacted: true,
      contactedAt: new Date(),
      leaderNote: note ?? null,
    },
  });

  revalidatePath("/dashboard/mobile/leader/checkins");
}
