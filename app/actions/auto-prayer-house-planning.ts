"use server";

import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval, startOfDay, endOfDay, addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { en } from "zod/v4/locales";

const NIGHT_SLOTS = ["00:00", "01:00", "02:00", "03:00"];
const nexHours = (hour: string) => {
    const [h, m] = hour.split(":").map(Number);
    const nextHour = (h + 1) % 24;
    return `${nextHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
export async function autoFillPlanning(assignmentId: string, date: Date) {
  const weekStart = addDays(startOfWeek(new Date(date), { weekStartsOn: 1 }), 1);
  const weekEnd = addDays(endOfWeek(weekStart, { weekStartsOn: 1 }), -2);

  try {
    // 1. Récupérer les données (Membres, Historique complet, Indispos, Planning actuel)
    const assignment = await prisma.familyWeeklyAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        schedules: true, // Pour savoir quels slots sont déjà pris
        family: {
          include: {
            members: {
              include: {
                // Historique pour le calcul de rotation
                familySchedules: { orderBy: { date: 'asc' }, select: { startTime: true },  },
                // Indisponibilités de la semaine
                unavailabilities: {
                  where: { startDate: { lte: weekEnd }, endDate: { gte: weekStart } }
                },
              }
            }
          }
        }
      }
    });

    if (!assignment) throw new Error("Assignation introuvable");

    // 2. Initialiser l'état des membres (Calcul des créneaux interdits au départ)
    let memberStates = assignment.family.members.map(m => {
      // Calcul du cycle initial (comme vu précédemment)
      const cycle = new Set<string>();
      m.familySchedules.forEach(s => {
        if (NIGHT_SLOTS.includes(s.startTime)) {
          cycle.add(s.startTime);
          if (cycle.size === 4) cycle.clear(); // Reset cycle complet
        }
      });

      return {
        id: m.id,
        name: m.name,
        phone: m.phone,
        unavailabilities: m.unavailabilities,
        forbiddenHours: Array.from(cycle), // Les heures interdites au début de la semaine
        shiftsThisWeek: 0 // Compteur pour équilibrer la charge
      };
    });

    // 3. Préparer les créneaux à remplir
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const newSchedules = [];

    for (const day of days) {
      for (const hour of NIGHT_SLOTS) {
        // A. Vérifier si le créneau est déjà pris manuellement
        const isTaken = assignment.schedules.some(
          s => format(new Date(s.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && s.startTime === hour
        );
        if (isTaken) continue;

        // B. Trouver les candidats éligibles
        const candidates = memberStates.filter(member => {
          // Check 1: Indisponibilité (Vacances, etc.)
          const isAbsent = member.unavailabilities.some(u => 
             isWithinInterval(startOfDay(day), { 
                start: startOfDay(u.startDate), 
                end: endOfDay(u.endDate) 
             })
          );
          if (isAbsent) return false;

          // Check 2: Contrainte de Rotation (Interdit si déjà fait dans ce cycle)
          if (member.forbiddenHours.includes(hour)) return false;

          return true;
        });

        if (candidates.length === 0) continue; // Personne dispo pour ce créneau

        // C. Choisir le "Moins chargé" (celui qui a le moins prié cette semaine)
        // On trie par nombre de shifts croissants, puis aléatoire pour éviter que ce soit toujours le même
        candidates.sort((a, b) => a.shiftsThisWeek - b.shiftsThisWeek || 0.5 - Math.random());
        const winner = candidates[0];

        // D. Enregistrer le slot
        newSchedules.push({
          date: day,
          startTime: hour,
          endTime: nexHours(hour),
          userId: winner.id,
          assignmentId: assignment.id
        });

        if (winner && winner.phone) {
          await sendSMS({
           to: winner.phone, 
           message: `Bonjour ${winner.name?.split(" ")[0]}, LE MDPI vous informe que vous êtes de service pour la maison de prière le  ${ format(new Date(day.toString()),  "dd:MM:yyyy")},  à ${hour}.`
        });
        }

        // E. MISE A JOUR DYNAMIQUE DE L'ÉTAT DU VAINQUEUR
        // C'est crucial : on met à jour ses "forbiddenHours" pour les jours suivants de la semaine !
        winner.shiftsThisWeek++;
        winner.forbiddenHours.push(hour);
        
        // Si le cycle est complet (il vient de faire sa 4ème heure différente), on reset !
        // Attention : il faut vérifier s'il a bien fait les 4 différentes.
        // Comme on filtre en amont (forbiddenHours.includes(hour)), on est sûr qu'il ne l'avait pas.
        // Donc on regarde juste la taille.
        const uniqueHours = new Set(winner.forbiddenHours);
        if (uniqueHours.size === 4) {
            winner.forbiddenHours = []; // Reset du cycle, il est dispo pour tout le monde le lendemain
        }
      }
    }

    // 4. Sauvegarde en masse dans la DB
    if (newSchedules.length > 0) {
      await prisma.familySchedule.createMany({
        data: newSchedules
      });
    }

    revalidatePath("/dashboard/leader/prayer-house");
    return { success: true, count: newSchedules.length };

  } catch (error) {
    console.error("Erreur auto-fill:", error);
    return { success: false, error: "Impossible de compléter automatiquement" };
  }
}



export async function clearPlanningSlots(assignmentId: string) {
  if (!assignmentId) return { success: false, error: "ID manquant" };

  try {
    // On supprime tous les créneaux liés à cette semaine
    await prisma.familySchedule.deleteMany({
      where: {
        assignmentId: assignmentId // Assurez-vous que c'est bien le nom de votre champ de relation
      }
    });

    revalidatePath("/dashboard/leader/prayer-house");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors du nettoyage du planning:", error);
    return { success: false, error: "Impossible de vider le planning" };
  }
}