"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { startOfWeek, endOfWeek, addDays } from "date-fns";
import { normalizeDate } from "@/lib/utils"; // Votre helper

// 1. Récupérer le planning d'une semaine donnée
export async function getNightPlanning(date: Date) {
  // On cale la date sur le Lundi de la semaine (00:00)
  const weekStart = startOfWeek(normalizeDate(date), { weekStartsOn: 1 });
  
  try {
    // On cherche si une famille est assignée cette semaine
    const assignment = await prisma.familyWeeklyAssignment.findUnique({
      where: { weekStart },
      include: {
        family: {
            include: { members: true } // On a besoin des membres pour le select
        },
        schedules: {
            include: { user: true } // On a besoin de voir qui est sur quel créneau
        }
      }
    });

    // Si pas d'assignation, on renvoie null, le front affichera le bouton "Assigner une famille"
    return { success: true, assignment };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erreur chargement planning nuit" };
  }
}

// 2. Assigner une famille à une semaine
export async function assignFamilyToWeek(date: Date, familyId: string) {
  const weekStart = startOfWeek(normalizeDate(date), { weekStartsOn: 1 });
  
  try {
    await prisma.familyWeeklyAssignment.upsert({
      where: { weekStart },
      update: { familyId }, // Si existe, on change la famille
      create: {
        weekStart,
        familyId
      }
    });
    revalidatePath("/dashboard/leader/prayer-house");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erreur assignation famille" };
  }
}

// 3. Assigner un membre à un créneau (ou le retirer)
export async function updateNightSlot(data: { 
    assignmentId: string, 
    date: Date, 
    startTime: string, 
    userId: string | "REMOVE" 
}) {
  try {
    // Si on veut retirer la personne
    if (data.userId === "REMOVE") {
      await prisma.familySchedule.deleteMany({
        where: {
            assignmentId: data.assignmentId,
            date: data.date,
            startTime: data.startTime
        }
      });
    } else {
      // Sinon on assigne (Upsert : créer ou mettre à jour)
      // Note: prisma.familySchedule n'a pas d'index unique par défaut sur [date, startTime], 
      // donc on fait d'abord un findFirst pour voir s'il existe
      
      const existing = await prisma.familySchedule.findFirst({
        where: {
            assignmentId: data.assignmentId,
            date: data.date,
            startTime: data.startTime
        }
      });

      if (existing) {
        await prisma.familySchedule.update({
            where: { id: existing.id },
            data: { userId: data.userId }
        });
      } else {
        await prisma.familySchedule.create({
            data: {
                assignmentId: data.assignmentId,
                date: data.date,
                startTime: data.startTime,
                endTime:  `${parseInt(data.startTime) + 1}:00`.padStart(5, '0'), // ex: "01:00"
                userId: data.userId
            }
        });
      }
    }
    
    revalidatePath("/dashboard/leader/prayer-house");
    return { success: true };
  } catch (error) {
    console.error(error)
    return { success: false, error: "Erreur mise à jour créneau" };
  }
}


// ... imports existants (prisma, revalidatePath, addDays, startOfWeek)

export async function addWeeklySlot(assignmentId: string, weekStartDate: Date, time: string) {
  try {
    // 1. On détermine les 5 jours de la semaine (Lundi -> Vendredi)
    // weekStartDate doit être normalisé (début de journée)
    const days = Array.from({ length: 5 }).map((_, i) => addDays(weekStartDate, i));
    
    // 2. On crée les créneaux vides pour chaque jour
    // On utilise createMany si votre DB le supporte (Postgres), sinon boucle
    for (const day of days) {
      // Vérifier si le créneau existe déjà pour éviter les doublons
      const exists = await prisma.familySchedule.findFirst({
        where: {
            assignmentId,
            date: day,
            startTime: time
        }
      });

      if (!exists) {
        await prisma.familySchedule.create({
            data: {
                assignmentId,
                date: day,
                startTime: time,
                endTime: `${parseInt(time) + 1}:00`.padStart(5, '0'),
                userId: null // Créneau vide = "À pourvoir"
            }
        });
      }
    }

    revalidatePath("/dashboard/leader/prayer-house");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Impossible d'ajouter ce créneau" };
  }
}

// Optionnel : Pour supprimer une ligne horaire entière
export async function removeWeeklySlot(assignmentId: string, time: string) {
    try {
        await prisma.familySchedule.deleteMany({
            where: {
                assignmentId,
                startTime: time
            }
        });
        revalidatePath("/dashboard/leader/prayer-house");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erreur suppression" };
    }
}