"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { startOfWeek } from "date-fns";
import { normalizeDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getUserPrayerHouseData(date: Date) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non connecté");

  // 1. Récupérer l'utilisateur et sa famille
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { prayerFamily: true }
  });

  if (!user?.prayerFamily) {
    return { success: true, hasFamily: false };
  }

  // 2. Vérifier si sa famille est de garde cette semaine
  const weekStart = startOfWeek(normalizeDate(date), { weekStartsOn: 1 });
  
  const assignment = await prisma.familyWeeklyAssignment.findUnique({
    where: { weekStart },
    include: {
        family: true,
        schedules: { include: { user: true } },
        dayThemes: true
    }
  });

  const isFamilyOnDuty = assignment?.familyId === user.prayerFamily.id;

  return { 
    success: true, 
    hasFamily: true,
    family: user.prayerFamily,
    userId: user.id,
    assignment,
    isFamilyOnDuty
  };
}

// Action pour s'auto-assigner (ou se retirer)
export async function toggleSelfAssignment(data: {
    assignmentId: string,
    date: Date,
    startTime: string,
    action: "JOIN" | "LEAVE"
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Non connecté");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("Utilisateur introuvable");

    try {
        if (data.action === "LEAVE") {
            // Se retirer
            await prisma.familySchedule.deleteMany({
                where: {
                    assignmentId: data.assignmentId,
                    date: data.date,
                    startTime: data.startTime,
                    userId: user.id // Sécurité : on ne retire que soi-même
                }
            });
        } else {
            // S'ajouter (JOIN)
            // On vérifie d'abord si le créneau est libre
            const existing = await prisma.familySchedule.findFirst({
                where: {
                    assignmentId: data.assignmentId,
                    date: data.date,
                    startTime: data.startTime
                }
            });

            if (existing) {
                return { success: false, error: "Créneau déjà pris !" };
            }

            await prisma.familySchedule.create({
                data: {
                    assignmentId: data.assignmentId,
                    date: data.date,
                    startTime: data.startTime,
                    endTime: `${parseInt(data.startTime) + 1}:00`.padStart(5, '0'),
                    userId: user.id
                }
            });
        }

        revalidatePath("/dashboard/user/prayer-house");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erreur lors de l'inscription" };
    }
}