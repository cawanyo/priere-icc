"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { startOfWeek, endOfWeek, addDays } from "date-fns";
import { pusherServer } from "@/lib/pusher";

// 1. Récupérer le planning d'une semaine donnée
export async function getNightPlanning(date: Date) {
  // On cale la date sur le Lundi de la semaine (00:00)
  const weekStart = startOfWeek(new Date(date), { weekStartsOn: 1 });
  
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
        },
        dayThemes: true
      }
    });

    // Si pas d'assignation, on renvoie null, le front affichera le bouton "Assigner une famille"
    return { success: true, assignment };
  } catch (error) {
    return { success: false, error: "Erreur chargement planning nuit" , errorDetails: error  };
  }
}

// 2. Assigner une famille à une semaine
export async function assignFamilyToWeek(date: String, familyId: string) {
  const weekStart = startOfWeek(new Date(date.toString()), { weekStartsOn: 1 });
  
  try {
    await prisma.familyWeeklyAssignment.upsert({
      where: { weekStart },
      update: { familyId }, // Si existe, on change la famille
      create: {
        weekStart,
        familyId: familyId
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
    date: String, 
    startTime: string, 
    userId: string | "REMOVE" 
}) {
  const cleanDate = new Date(data.date.toString()); // Normaliser la date  
  try {
    // Si on veut retirer la personne
    if (data.userId === "REMOVE") {
      await prisma.familySchedule.deleteMany({
        where: {
            assignmentId: data.assignmentId,
            date: cleanDate,
            startTime: data.startTime
        }
      });
    } else {
      
      const existing = await prisma.familySchedule.findFirst({
        where: {
            assignmentId: data.assignmentId,
            date: cleanDate,
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
                date: cleanDate,
                startTime: data.startTime,
                endTime:  `${parseInt(data.startTime) + 1}:00`.padStart(5, '0'), // ex: "01:00"
                userId: data.userId
            }
        });
      }
    }

    await pusherServer.trigger("prayer-planning", "update", {
      message: "Planning modifié"
    });
    
    revalidatePath("/dashboard/leader/prayer-house");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erreur mise à jour créneau" };
  }
}


// ... imports existants (prisma, revalidatePath, addDays, startOfWeek)

export async function addWeeklySlot(assignmentId: string, weekStartDate: Date, time: string) {
  try {
    // 1. On détermine les 5 jours de la semaine (Lundi -> Vendredi)
    // weekStartDate doit être normalisé (début de journée)
    const days = Array.from({ length: 5 }).map((_, i) => addDays(new Date(weekStartDate), i));
    
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




export async function updateWeekTheme(assignmentId: string, theme: string) {
  try {
      await prisma.familyWeeklyAssignment.update({
          where: { id: assignmentId },
          data: { weekTheme: theme }
      });
      revalidatePath("/dashboard/leader/prayer-house");
      return { success: true };
  } catch (e) {
      return { success: false, error: "Erreur thème semaine" };
  }
}

// 3. NOUVEAU: Sauvegarder le thème du JOUR
export async function updateDayTheme(assignmentId: string, date: String, theme: string) {
  try {
      // On normalise la date pour être sûr qu'elle est à 00:00
      const cleanDate = new Date(date.toString()); 
      
      if (!theme) {
          // Si le thème est vide, on le supprime
          await prisma.familyDayTheme.deleteMany({
              where: { assignmentId, date: cleanDate }
          });
      } else {
          // Sinon on crée ou met à jour (Upsert)
          await prisma.familyDayTheme.upsert({
              where: {
                  assignmentId_date: { assignmentId, date: cleanDate }
              },
              update: { theme },
              create: {
                  assignmentId,
                  date: cleanDate,
                  theme
              }
          });
      }
      revalidatePath("/dashboard/leader/prayer-house");
      return { success: true };
  } catch (e) {
      return { success: false, error: "Erreur thème jour" };
  }
}