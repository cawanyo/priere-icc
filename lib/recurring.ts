import { prisma } from "@/lib/prisma";
import { getDay, format, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from "date-fns";

/**
 * Génère automatiquement les créneaux réels dans la table Planning
 * pour tous les modèles RecurringSchedule actifs sur la plage de dates demandée.
 */
export async function generateRecurringPlannings(startDate: Date, endDate: Date) {
  try {
    const recurringSchedules = await prisma.recurringSchedule.findMany();
    if (recurringSchedules.length === 0) return;

    // Normaliser sur la semaine complète pour couvrir tous les jours
    const start = startOfWeek(new Date(startDate), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(endDate), { weekStartsOn: 1 });

    let current = startOfDay(start);
    const endLimit = endOfDay(end);

    while (current <= endLimit) {
      const dayIndex = getDay(current); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
      const matchingSchedules = recurringSchedules.filter((s) => s.dayOfWeek === dayIndex);

      if (matchingSchedules.length > 0) {
        // Date normalisée à minuit UTC pour correspondre au format de Planning.date
        const dateStr = format(current, "yyyy-MM-dd");
        const slotDate = new Date(`${dateStr}T00:00:00.000Z`);

        for (const schedule of matchingSchedules) {
          // Vérifier si un créneau existe déjà pour ce jour précis
          const existing = await prisma.planning.findFirst({
            where: {
              date: slotDate,
              specialEventId: null,
              OR: [
                { recurringId: schedule.id },
                {
                  title: schedule.title,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime,
                },
              ],
            },
          });

          if (!existing) {
            await prisma.planning.create({
              data: {
                title: schedule.title,
                description: schedule.description || null,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                recurringId: schedule.id,
                specialEventId: null,
                date: slotDate,
              },
            });
          }
        }
      }

      current = addDays(current, 1);
    }
  } catch (error) {
    console.error("[generateRecurringPlannings] Erreur lors de la génération des créneaux:", error);
  }
}
